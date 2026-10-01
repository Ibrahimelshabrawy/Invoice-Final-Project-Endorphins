import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Setting } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STATUS_COLORS = {
  DRAFT: { bg: '#F1F3F4', text: '#5F6368', border: '#DADCE0' },
  SENT: { bg: '#E8F0FE', text: '#1A73E8', border: '#AECBFA' },
  PAID: { bg: '#E6F4EA', text: '#137333', border: '#A8DAB5' },
  OVERDUE: { bg: '#FCE8E6', text: '#C5221F', border: '#F6AEA9' },
  CANCELLED: { bg: '#EEEEEE', text: '#616161', border: '#BDBDBD' },
};

/**
 * Fetches company settings from DB or returns defaults
 */
export const getCompanyDetails = async () => {
  try {
    const settings = await Setting.findAll();
    const map = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }

    return {
      name: map.company_name || 'Endorphins Software Solutions',
      address: map.company_address || '123 Business Avenue, Smart Village, Cairo, Egypt',
      phone: map.company_phone || '+20 2 3535 0000',
      email: map.company_email || 'invoicing@endorphins.io',
      taxNumber: map.company_tax_number || 'EG-987-654-321',
      logoPath: map.company_logo || path.join(__dirname, '../assets/logo.jpg'),
    };
  } catch (error) {
    return {
      name: 'Endorphins Software Solutions',
      address: '123 Business Avenue, Smart Village, Cairo, Egypt',
      phone: '+20 2 3535 0000',
      email: 'invoicing@endorphins.io',
      taxNumber: 'EG-987-654-321',
      logoPath: path.join(__dirname, '../assets/logo.jpg'),
    };
  }
};

/**
 * Generates a PDF buffer for a given invoice object
 * @param {Object} invoice Invoice object with client, items, taxes
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateInvoicePDFBuffer = async (invoice) => {
  const company = await getCompanyDetails();

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Invoice ${invoice.invoiceNumber}`,
          Author: company.name,
          Subject: `Invoice for ${invoice.client ? invoice.client.name : 'Client'}`,
        },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#1E3A8A'; // Deep Indigo/Navy
      const secondaryColor = '#475569'; // Slate
      const darkColor = '#0F172A';
      const lightBg = '#F8FAFC';
      const borderColor = '#E2E8F0';

      // --- 1. Header (Logo & Company Info + Invoice Meta) ---
      let startY = 40;
      let logoDrawn = false;

      if (company.logoPath && fs.existsSync(company.logoPath)) {
        try {
          doc.image(company.logoPath, 40, startY, { width: 60, height: 60 });
          logoDrawn = true;
        } catch (e) {
          logoDrawn = false;
        }
      }

      const compX = logoDrawn ? 110 : 40;
      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor(primaryColor)
        .text(company.name, compX, startY);

      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(secondaryColor)
        .moveDown(0.2)
        .text(company.address, compX)
        .text(`Phone: ${company.phone}  |  Email: ${company.email}`, compX)
        .text(`Tax Reg. No: ${company.taxNumber}`, compX);

      // Invoice Title & Meta (Right aligned)
      const rightX = 350;
      doc
        .font('Helvetica-Bold')
        .fontSize(22)
        .fillColor(primaryColor)
        .text('INVOICE', rightX, startY, { align: 'right', width: 205 });

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(darkColor)
        .text(`Invoice #: ${invoice.invoiceNumber}`, rightX, startY + 28, {
          align: 'right',
          width: 205,
        });

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(secondaryColor)
        .text(`Issue Date: ${invoice.issueDate}`, rightX, startY + 43, {
          align: 'right',
          width: 205,
        })
        .text(`Due Date: ${invoice.dueDate}`, rightX, startY + 56, {
          align: 'right',
          width: 205,
        });

      // Status Pill / Badge
      const statusKey = invoice.status || 'DRAFT';
      const badgeTheme = STATUS_COLORS[statusKey] || STATUS_COLORS.DRAFT;
      const badgeWidth = 74;
      const badgeHeight = 18;
      const badgeX = 555 - badgeWidth;
      const badgeY = startY + 72;

      doc
        .roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 4)
        .fillColor(badgeTheme.bg)
        .fill()
        .strokeColor(badgeTheme.border)
        .lineWidth(0.75)
        .stroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(badgeTheme.text)
        .text(statusKey, badgeX, badgeY + 4.5, {
          width: badgeWidth,
          align: 'center',
        });

      // --- Divider ---
      const line1Y = 125;
      doc
        .strokeColor(borderColor)
        .lineWidth(1)
        .moveTo(40, line1Y)
        .lineTo(555, line1Y)
        .stroke();

      // --- 2. Bill To & Payment Info ---
      const billToY = 138;
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(primaryColor)
        .text('BILL TO:', 40, billToY);

      const client = invoice.client || {};
      let clientTextY = billToY + 14;

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(darkColor)
        .text(client.name || 'Valued Client', 40, clientTextY);
      clientTextY += 13;

      doc.font('Helvetica').fontSize(9).fillColor(secondaryColor);

      if (client.company) {
        doc.text(client.company, 40, clientTextY);
        clientTextY += 12;
      }
      if (client.email) {
        doc.text(`Email: ${client.email}`, 40, clientTextY);
        clientTextY += 12;
      }
      if (client.phone) {
        doc.text(`Phone: ${client.phone}`, 40, clientTextY);
        clientTextY += 12;
      }
      if (client.address) {
        doc.text(`Address: ${client.address}`, 40, clientTextY, { width: 220 });
        clientTextY += 14;
      }
      if (client.taxNumber) {
        doc.text(`Client Tax ID: ${client.taxNumber}`, 40, clientTextY);
        clientTextY += 12;
      }

      // Currency & Terms on the right
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(primaryColor)
        .text('CURRENCY:', 380, billToY)
        .font('Helvetica')
        .fillColor(darkColor)
        .text(invoice.currency || 'EGP', 460, billToY);

      if (invoice.paymentTerms) {
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor(primaryColor)
          .text('TERMS:', 380, billToY + 16)
          .font('Helvetica')
          .fillColor(darkColor)
          .text(invoice.paymentTerms, 460, billToY + 16, { width: 95 });
      }

      // --- 3. Items Table ---
      const tableTopY = Math.max(clientTextY + 15, 230);

      // Table Header Background
      doc
        .rect(40, tableTopY, 515, 24)
        .fillColor(lightBg)
        .fill()
        .strokeColor(borderColor)
        .lineWidth(1)
        .stroke();

      // Column Layout
      // Col 1: Description (width 230, x: 48)
      // Col 2: Type (width 60, x: 285)
      // Col 3: Qty (width 50, x: 350, right-aligned)
      // Col 4: Unit Price (width 65, x: 410, right-aligned)
      // Col 5: Total (width 70, x: 480, right-aligned)
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(secondaryColor)
        .text('DESCRIPTION', 48, tableTopY + 7, { width: 230 })
        .text('TYPE', 285, tableTopY + 7, { width: 60 })
        .text('QTY', 350, tableTopY + 7, { width: 50, align: 'right' })
        .text('UNIT PRICE', 410, tableTopY + 7, { width: 65, align: 'right' })
        .text('TOTAL', 480, tableTopY + 7, { width: 70, align: 'right' });

      let currentY = tableTopY + 24;
      const items = invoice.items || [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Format values
        const qty = Number(item.quantity).toFixed(2);
        const unitPrice = Number(item.unitPrice).toFixed(2);
        const lineTotal = Number(item.lineTotal).toFixed(2);
        const desc = item.description || `Item #${item.refId}`;
        const itemType = item.itemType || 'SERVICE';

        const rowHeight = 24;

        // Check page overflow
        if (currentY + rowHeight > 700) {
          doc.addPage();
          currentY = 40;
        }

        // Alternating row background
        if (i % 2 === 1) {
          doc.rect(40, currentY, 515, rowHeight).fillColor('#FBFCFE').fill();
        }

        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor(darkColor)
          .text(desc, 48, currentY + 7, { width: 230, ellipsis: true })
          .fillColor(secondaryColor)
          .text(itemType, 285, currentY + 7, { width: 60 })
          .fillColor(darkColor)
          .text(qty, 350, currentY + 7, { width: 50, align: 'right' })
          .text(unitPrice, 410, currentY + 7, { width: 65, align: 'right' })
          .text(lineTotal, 480, currentY + 7, { width: 70, align: 'right' });

        currentY += rowHeight;

        // Row bottom line
        doc
          .strokeColor(borderColor)
          .lineWidth(0.5)
          .moveTo(40, currentY)
          .lineTo(555, currentY)
          .stroke();
      }

      // --- 4. Summary & Notes Section ---
      currentY += 15;
      if (currentY > 660) {
        doc.addPage();
        currentY = 40;
      }

      const summaryStartY = currentY;

      // Left Box: Notes & Terms
      if (invoice.notes) {
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor(primaryColor)
          .text('NOTES:', 40, summaryStartY);

        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor(secondaryColor)
          .text(invoice.notes, 40, summaryStartY + 14, { width: 250 });
      }

      // Right Box: Financial Summary Box
      const sumBoxX = 330;
      const sumBoxWidth = 225;
      let sumY = summaryStartY;

      // Subtotal
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(secondaryColor)
        .text('Subtotal:', sumBoxX, sumY, { width: 110 })
        .font('Helvetica-Bold')
        .fillColor(darkColor)
        .text(
          `${Number(invoice.subtotal).toFixed(2)} ${invoice.currency || 'EGP'}`,
          sumBoxX + 110,
          sumY,
          { width: 110, align: 'right' }
        );
      sumY += 16;

      // Taxes breakdown
      const taxes = invoice.taxes || [];
      if (taxes.length > 0) {
        for (const tax of taxes) {
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor(secondaryColor)
            .text(`${tax.name} (${tax.rate}%):`, sumBoxX, sumY, { width: 110 })
            .font('Helvetica')
            .fillColor(darkColor)
            .text(
              `${Number(tax.amount).toFixed(2)} ${invoice.currency || 'EGP'}`,
              sumBoxX + 110,
              sumY,
              { width: 110, align: 'right' }
            );
          sumY += 16;
        }
      } else if (Number(invoice.taxTotal) > 0) {
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor(secondaryColor)
          .text('Taxes:', sumBoxX, sumY, { width: 110 })
          .font('Helvetica')
          .fillColor(darkColor)
          .text(
            `${Number(invoice.taxTotal).toFixed(2)} ${invoice.currency || 'EGP'}`,
            sumBoxX + 110,
            sumY,
            { width: 110, align: 'right' }
          );
        sumY += 16;
      }

      // Invoice Discount
      if (Number(invoice.discount) > 0) {
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#C5221F')
          .text('Invoice Discount:', sumBoxX, sumY, { width: 110 })
          .font('Helvetica-Bold')
          .text(
            `-${Number(invoice.discount).toFixed(2)} ${invoice.currency || 'EGP'}`,
            sumBoxX + 110,
            sumY,
            { width: 110, align: 'right' }
          );
        sumY += 16;
      }

      // Grand Total Highlight Box
      sumY += 4;
      doc
        .roundedRect(sumBoxX - 5, sumY, sumBoxWidth + 5, 28, 4)
        .fillColor('#F1F5F9')
        .fill()
        .strokeColor(primaryColor)
        .lineWidth(1)
        .stroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(primaryColor)
        .text('TOTAL AMOUNT:', sumBoxX + 5, sumY + 8, { width: 100 })
        .fontSize(12)
        .text(
          `${Number(invoice.total).toFixed(2)} ${invoice.currency || 'EGP'}`,
          sumBoxX + 105,
          sumY + 7,
          { width: 110, align: 'right' }
        );

      // --- 5. Footer ---
      const pageBottom = 780;
      doc
        .strokeColor(borderColor)
        .lineWidth(0.5)
        .moveTo(40, pageBottom - 20)
        .lineTo(555, pageBottom - 20)
        .stroke();

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(secondaryColor)
        .text(
          'Thank you for your business. For questions regarding this invoice, please contact support.',
          40,
          pageBottom - 10,
          { align: 'center', width: 515 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

export default {
  getCompanyDetails,
  generateInvoicePDFBuffer,
};
