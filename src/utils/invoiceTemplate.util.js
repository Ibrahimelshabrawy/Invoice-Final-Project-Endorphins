/**
 * Invoice HTML/CSS template generator with full Arabic (RTL) and English (LTR) localization.
 * Implements a modern, clean, professional black-and-white / grayscale design.
 */

export const translations = {
  EN: {
    invoice: 'INVOICE',
    invoiceDetails: 'Invoice Details',
    invoiceNumber: 'Invoice #',
    issueDate: 'Issue Date',
    dueDate: 'Due Date',
    status: 'Status',
    billTo: 'BILL TO',
    clientTaxId: 'Tax ID',
    currency: 'Currency',
    paymentTerms: 'Payment Terms',
    description: 'Description',
    type: 'Type',
    quantity: 'Qty',
    unitPrice: 'Unit Price',
    total: 'Total',
    subtotal: 'Subtotal',
    discount: 'Discount',
    tax: 'Tax',
    taxes: 'Taxes',
    grandTotal: 'Total Amount',
    notes: 'Notes',
    footerMessage: 'Thank you for your business. For questions regarding this invoice, please contact support.',
    phone: 'Phone',
    email: 'Email',
    taxRegNo: 'Tax Reg. No',
    statusLabels: {
      DRAFT: 'Draft',
      SENT: 'Sent',
      PAID: 'Paid',
      OVERDUE: 'Overdue',
      CANCELLED: 'Cancelled',
    },
    types: {
      SERVICE: 'Service',
      BUNDLE: 'Bundle',
    },
  },
  AR: {
    invoice: 'فاتورة',
    invoiceDetails: 'تفاصيل الفاتورة',
    invoiceNumber: 'رقم الفاتورة',
    issueDate: 'تاريخ الإصدار',
    dueDate: 'تاريخ الاستحقاق',
    status: 'الحالة',
    billTo: 'فاتورة إلى',
    clientTaxId: 'الرقم الضريبي',
    currency: 'العملة',
    paymentTerms: 'شروط الدفع',
    description: 'الوصف',
    type: 'النوع',
    quantity: 'الكمية',
    unitPrice: 'سعر الوحدة',
    total: 'الإجمالي',
    subtotal: 'الإجمالي الفرعي',
    discount: 'الخصم',
    tax: 'الضريبة',
    taxes: 'الضرائب',
    grandTotal: 'المبلغ الإجمالي',
    notes: 'ملاحظات',
    footerMessage: 'شكراً لتعاملكم معنا. للاستفسار بخصوص هذه الفاتورة، يُرجى التواصل معنا.',
    phone: 'هاتف',
    email: 'البريد',
    taxRegNo: 'رقم التسجيل الضريبي',
    statusLabels: {
      DRAFT: 'مسودة',
      SENT: 'تم الإرسال',
      PAID: 'مدفوعة',
      OVERDUE: 'متأخرة',
      CANCELLED: 'ملغاة',
    },
    types: {
      SERVICE: 'خدمة',
      BUNDLE: 'باقة',
    },
  },
};

/**
 * Escapes HTML entities to prevent injection
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Formats decimal numbers with 2 decimal places and thousands separators
 */
function formatNumber(val) {
  const num = Number(val || 0);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Generates the complete HTML document for an invoice
 * @param {Object} invoice Invoice object with client, items, taxes
 * @param {Object} company Company details object
 * @returns {string} HTML string
 */
export const generateInvoiceHtml = (invoice, company = {}) => {
  const isArabic = String(invoice.language || '').toUpperCase() === 'AR';
  const langKey = isArabic ? 'AR' : 'EN';
  const dir = isArabic ? 'rtl' : 'ltr';
  const t = translations[langKey];

  const currency = escapeHtml(invoice.currency || 'EGP');
  const statusKey = String(invoice.status || 'DRAFT').toUpperCase();
  const statusLabel = t.statusLabels[statusKey] || statusKey;

  const client = invoice.client || {};
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const taxes = Array.isArray(invoice.taxes) ? invoice.taxes : [];

  // Items table rows
  // Items table rows
  const itemRowsHtml = items
    .map((item, idx) => {
      const typeKey = String(item.itemType || 'SERVICE').toUpperCase();
      const typeLabel = t.types[typeKey] || typeKey;
      const desc = escapeHtml(item.description || `Item #${item.refId || idx + 1}`);
      const qty = formatNumber(item.quantity);
      const unitPrice = formatNumber(item.unitPrice);
      const lineTotal = formatNumber(item.lineTotal);

      return `
        <tr>
          <td class="col-desc">
            <div class="item-name">${desc}</div>
          </td>
          <td class="col-type"><span class="type-pill">${escapeHtml(typeLabel)}</span></td>
          <td class="col-qty"><span class="cell-num">${qty}</span></td>
          <td class="col-price"><span class="cell-num">${unitPrice}</span></td>
          <td class="col-total"><span class="cell-num">${lineTotal}</span></td>
        </tr>
      `;
    })
    .join('');

  // Helper to format tax display name with Arabic VAT translation
  const formatTaxDisplayName = (tax) => {
    let name = (tax.name || '').trim();
    const rate = Number(tax.rate || 0);

    if (isArabic) {
      // Convert VAT / Value Added Tax to equal Arabic meaning
      name = name
        .replace(/\bValue\s+Added\s+Tax\b/gi, 'ضريبة القيمة المضافة')
        .replace(/\bVAT\b/gi, 'ضريبة القيمة المضافة')
        .replace(/\bZero\s+Rated\s+VAT\b/gi, 'ضريبة القيمة المضافة (نسبة صفرية)')
        .replace(/\bSchedule\s+Tax\b/gi, 'ضريبة الجدول')
        .replace(/\bNo\s+Tax\b/gi, 'بدون ضريبة');

      if (!name) {
        name = 'ضريبة القيمة المضافة';
      }
    } else if (!name) {
      name = t.tax;
    }

    // Check if percentage is already in the name
    const rateStr = `${rate}%`;
    const hasRate = name.includes(rateStr) || /%\s*$/.test(name);

    if (!hasRate && rate > 0) {
      return `${name} (${rateStr})`;
    } else if (hasRate && !name.includes('(') && rate > 0) {
      return name.replace(new RegExp(`\\s*${rate}%`), ` (${rateStr})`);
    }

    return name;
  };

  // Tax rows in totals section
  let taxRowsHtml = '';
  if (taxes.length > 0) {
    taxRowsHtml = taxes
      .map((tax) => {
        const displayTaxName = formatTaxDisplayName(tax);
        const taxAmount = formatNumber(tax.amount);
        return `
          <div class="summary-row">
            <span class="summary-label">${escapeHtml(displayTaxName)}:</span>
            <span class="summary-value" dir="ltr">${taxAmount} ${currency}</span>
          </div>
        `;
      })
      .join('');
  } else if (Number(invoice.taxTotal) > 0) {
    const defaultTaxLabel = isArabic ? 'ضريبة القيمة المضافة' : t.taxes;
    taxRowsHtml = `
      <div class="summary-row">
        <span class="summary-label">${defaultTaxLabel}:</span>
        <span class="summary-value" dir="ltr">${formatNumber(invoice.taxTotal)} ${currency}</span>
      </div>
    `;
  }

  // Discount row
  let discountRowHtml = '';
  if (Number(invoice.discount) > 0) {
    discountRowHtml = `
      <div class="summary-row discount-row">
        <span class="summary-label">${t.discount}:</span>
        <span class="summary-value" dir="ltr">- ${formatNumber(invoice.discount)} ${currency}</span>
      </div>
    `;
  }

  // Logo tag
  const logoHtml = company.logoDataUri
    ? `<img src="${company.logoDataUri}" alt="${escapeHtml(company.name)}" class="company-logo" />`
    : '';

  return `<!DOCTYPE html>
<html lang="${isArabic ? 'ar' : 'en'}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(t.invoice)} ${escapeHtml(invoice.invoiceNumber || '')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 16mm 14mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      font-size: 11.5px;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    [dir="rtl"] body,
    [dir="rtl"] {
      font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
    }

    .invoice-container {
      width: 100%;
      margin: 0 auto;
    }

    /* Header Section */
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
      border-bottom: 2px solid #111827;
    }

    .company-block {
      display: flex;
      gap: 14px;
      max-width: 55%;
    }

    .company-logo {
      width: 58px;
      height: 58px;
      object-fit: contain;
      flex-shrink: 0;
      border-radius: 4px;
    }

    .company-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
      text-align: start;
    }

    .company-name {
      font-size: 16px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 2px;
      letter-spacing: -0.01em;
    }

    .company-meta-line {
      font-size: 9.5px;
      color: #4b5563;
    }

    .invoice-meta-block {
      text-align: end;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 3px;
    }

    [dir="rtl"] .invoice-meta-block {
      text-align: start;
      align-items: flex-start;
    }

    .invoice-title {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: #111827;
      line-height: 1;
      margin-bottom: 6px;
    }

    .meta-row {
      display: flex;
      gap: 8px;
      font-size: 10px;
      color: #374151;
    }

    .meta-label {
      color: #6b7280;
      font-weight: 500;
    }

    .meta-value {
      font-weight: 600;
      color: #111827;
    }

    .status-badge {
      display: inline-block;
      margin-top: 5px;
      padding: 3px 10px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: #f3f4f6;
      color: #1f2937;
      border: 1px solid #d1d5db;
      border-radius: 3px;
    }

    /* Parties / Info Section */
    .parties-section {
      display: flex;
      justify-content: space-between;
      margin-top: 18px;
      margin-bottom: 22px;
      gap: 20px;
    }

    .bill-to-box {
      flex: 1;
      max-width: 55%;
      text-align: start;
    }

    .section-eyebrow {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 3px;
    }

    .client-name {
      font-size: 13px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 3px;
    }

    .client-detail {
      font-size: 10px;
      color: #4b5563;
      line-height: 1.4;
    }

    .billing-meta-box {
      flex: 0 0 38%;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .billing-meta-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px dashed #e5e7eb;
      font-size: 10px;
    }

    .billing-meta-row:last-child {
      border-bottom: none;
    }

    .billing-meta-label {
      color: #6b7280;
      font-weight: 500;
    }

    .billing-meta-value {
      font-weight: 600;
      color: #111827;
    }

    /* Items Table */
    .table-container {
      width: 100%;
      margin-bottom: 20px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
    }

    thead {
      display: table-header-group;
    }

    tr {
      page-break-inside: avoid;
      break-inside: avoid;
      page-break-after: auto;
    }

    th {
      background-color: #f3f4f6;
      color: #111827;
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 8px 10px;
      border-top: 1px solid #111827;
      border-bottom: 1px solid #111827;
    }

    td {
      padding: 9px 10px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 10.5px;
      color: #1f2937;
      vertical-align: middle;
    }

    tbody tr:nth-child(even) td {
      background-color: #fafafa;
    }

    .col-desc {
      text-align: start;
      width: 44%;
    }

    .item-name {
      font-weight: 500;
      color: #111827;
    }

    .col-type {
      text-align: center;
      width: 12%;
    }

    .type-pill {
      display: inline-block;
      padding: 2px 7px;
      font-size: 8.5px;
      font-weight: 600;
      color: #374151;
      background: #e5e7eb;
      border-radius: 2px;
      letter-spacing: 0.02em;
    }

    .col-qty {
      text-align: center;
      width: 12%;
      font-variant-numeric: tabular-nums;
    }

    .col-price {
      text-align: end;
      width: 16%;
      font-variant-numeric: tabular-nums;
    }

    .col-total {
      text-align: end;
      width: 16%;
      font-weight: 600;
      color: #111827;
      font-variant-numeric: tabular-nums;
    }

    .cell-num {
      display: inline-block;
      direction: ltr;
      unicode-bidi: embed;
    }

    /* Financial Summary & Notes */
    .bottom-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 10px;
      gap: 24px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .notes-box {
      flex: 1;
      max-width: 52%;
      display: flex;
      flex-direction: column;
      gap: 12px;
      text-align: start;
    }

    .note-block {
      background: #fafafa;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 10px 12px;
    }

    .note-title {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #4b5563;
      margin-bottom: 4px;
    }

    .note-content {
      font-size: 10px;
      color: #374151;
      white-space: pre-wrap;
      line-height: 1.4;
    }

    .totals-box {
      flex: 0 0 42%;
      display: flex;
      flex-direction: column;
      gap: 5px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 12px 14px;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 3px 0;
      font-size: 10.5px;
      color: #4b5563;
    }

    .summary-label {
      font-weight: 500;
    }

    .summary-value {
      font-weight: 600;
      color: #111827;
      font-variant-numeric: tabular-nums;
    }

    .discount-row {
      color: #374151;
    }

    .grand-total-row {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 2px solid #111827;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .grand-total-label {
      font-size: 12px;
      font-weight: 700;
      color: #111827;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .grand-total-value {
      font-size: 15px;
      font-weight: 800;
      color: #111827;
      font-variant-numeric: tabular-nums;
    }

    /* Footer */
    .footer-section {
      margin-top: 36px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 9px;
      color: #6b7280;
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <header class="header-section">
      <div class="company-block">
        ${logoHtml}
        <div class="company-details">
          <div class="company-name">${escapeHtml(company.name || 'Company Name')}</div>
          ${company.address ? `<div class="company-meta-line">${escapeHtml(company.address)}</div>` : ''}
          ${company.phone || company.email ? `
            <div class="company-meta-line">
              ${company.phone ? `${escapeHtml(t.phone)}: <span dir="ltr">${escapeHtml(company.phone)}</span>` : ''}
              ${company.phone && company.email ? '&nbsp;|&nbsp;' : ''}
              ${company.email ? `${escapeHtml(t.email)}: <span dir="ltr">${escapeHtml(company.email)}</span>` : ''}
            </div>` : ''}
          ${company.taxNumber ? `<div class="company-meta-line">${escapeHtml(t.taxRegNo)}: <span dir="ltr">${escapeHtml(company.taxNumber)}</span></div>` : ''}
        </div>
      </div>

      <div class="invoice-meta-block">
        <div class="invoice-title">${escapeHtml(t.invoice)}</div>
        <div class="meta-row">
          <span class="meta-label">${escapeHtml(t.invoiceNumber)}:</span>
          <span class="meta-value" dir="ltr">${escapeHtml(invoice.invoiceNumber || '---')}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">${escapeHtml(t.issueDate)}:</span>
          <span class="meta-value" dir="ltr">${escapeHtml(invoice.issueDate || '---')}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">${escapeHtml(t.dueDate)}:</span>
          <span class="meta-value" dir="ltr">${escapeHtml(invoice.dueDate || '---')}</span>
        </div>
        <div class="status-badge">${escapeHtml(statusLabel)}</div>
      </div>
    </header>

    <!-- Parties & Meta Section -->
    <section class="parties-section">
      <div class="bill-to-box">
        <div class="section-eyebrow">${escapeHtml(t.billTo)}</div>
        <div class="client-name">${escapeHtml(client.name || 'Valued Client')}</div>
        ${client.company ? `<div class="client-detail">${escapeHtml(client.company)}</div>` : ''}
        ${client.email ? `<div class="client-detail">${escapeHtml(t.email)}: <span dir="ltr">${escapeHtml(client.email)}</span></div>` : ''}
        ${client.phone ? `<div class="client-detail">${escapeHtml(t.phone)}: <span dir="ltr">${escapeHtml(client.phone)}</span></div>` : ''}
        ${client.address ? `<div class="client-detail">${escapeHtml(client.address)}</div>` : ''}
        ${client.taxNumber ? `<div class="client-detail">${escapeHtml(t.clientTaxId)}: <span dir="ltr">${escapeHtml(client.taxNumber)}</span></div>` : ''}
      </div>

      <div class="billing-meta-box">
        <div class="section-eyebrow">${escapeHtml(t.invoiceDetails)}</div>
        <div class="billing-meta-row">
          <span class="billing-meta-label">${escapeHtml(t.currency)}:</span>
          <span class="billing-meta-value" dir="ltr">${currency}</span>
        </div>
        ${invoice.paymentTerms ? `
          <div class="billing-meta-row">
            <span class="billing-meta-label">${escapeHtml(t.paymentTerms)}:</span>
            <span class="billing-meta-value">${escapeHtml(invoice.paymentTerms)}</span>
          </div>` : ''}
      </div>
    </section>

    <!-- Items Table -->
    <section class="table-container">
      <table>
        <thead>
          <tr>
            <th class="col-desc">${escapeHtml(t.description)}</th>
            <th class="col-type">${escapeHtml(t.type)}</th>
            <th class="col-qty">${escapeHtml(t.quantity)}</th>
            <th class="col-price">${escapeHtml(t.unitPrice)}</th>
            <th class="col-total">${escapeHtml(t.total)}</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHtml}
        </tbody>
      </table>
    </section>

    <!-- Bottom Section: Notes & Financial Totals -->
    <section class="bottom-section">
      <div class="notes-box">
        ${invoice.notes ? `
          <div class="note-block">
            <div class="note-title">${escapeHtml(t.notes)}</div>
            <div class="note-content">${escapeHtml(invoice.notes)}</div>
          </div>` : ''}
      </div>

      <div class="totals-box">
        <div class="summary-row">
          <span class="summary-label">${escapeHtml(t.subtotal)}:</span>
          <span class="summary-value" dir="ltr">${formatNumber(invoice.subtotal)} ${currency}</span>
        </div>
        ${discountRowHtml}
        ${taxRowsHtml}
        <div class="grand-total-row">
          <span class="grand-total-label">${escapeHtml(t.grandTotal)}:</span>
          <span class="grand-total-value" dir="ltr">${formatNumber(invoice.total)} ${currency}</span>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer-section">
      <div>${escapeHtml(t.footerMessage)}</div>
    </footer>
  </div>
</body>
</html>`;
};

export default {
  translations,
  generateInvoiceHtml,
};
