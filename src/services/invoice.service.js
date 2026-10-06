import { Op } from 'sequelize';
import {
  Invoice,
  InvoiceItem,
  InvoiceTax,
  InvoiceNumberCounter,
  Client,
  Service,
  Bundle,
  Tax,
  sequelize,
} from '../models/index.js';
import { ItemTypeEnum } from '../utils/enum/itemType.enum.js';
import { InvoiceStatusEnum } from '../utils/enum/invoiceStatus.enum.js';
import {
  invoiceIncludes,
  generateSequentialInvoiceNumber,
  getTodayDateString,
  getDefaultDueDateString,
  calculateInvoiceItemsAndTaxes,
} from '../utils/invoice.util.js';
import CurrencyEnum from '../utils/enum/currency.enum.js';
import LanguageEnum from '../utils/enum/language.enum.js';
import { generateInvoicePDFBuffer } from '../utils/pdf.util.js';
import * as tempPdfService from './tempPdf.service.js';

/**
 * Creates an invoice
 */
export const createInvoice = async (data) => {
  return await sequelize.transaction(async (t) => {
    // 1. Verify Client
    const client = await Client.findByPk(data.clientId, { transaction: t });
    if (!client) {
      throw new Error(`Client with ID ${data.clientId} not found`, { cause: 404 });
    }

    // 2. Dates
    const issueDate = data.issueDate || getTodayDateString();
    const dueDate = data.dueDate || getDefaultDueDateString(issueDate);

    if (new Date(dueDate) < new Date(issueDate)) {
      throw new Error('Due date cannot be before issue date', { cause: 400 });
    }

    // 3. Process items, invoice taxes, and discount
    const {
      processedItems,
      subtotal,
      taxTotal,
      invoiceTaxes,
      discountAmount,
      discountValue,
      discountType,
      total,
    } = await calculateInvoiceItemsAndTaxes(
      data.items,
      {
        discountValue: data.discountValue,
        discountType: data.discountType,
        taxIds: data.taxIds || [],
      },
      t
    );

    // 5. Generate sequential invoice number (e.g. INV-2026-00001)
    const invoiceNumber = await generateSequentialInvoiceNumber(issueDate, t);

    // 6. Create invoice record
    const status = data.status || InvoiceStatusEnum.DRAFT;

    const invoice = await Invoice.create(
      {
        invoiceNumber,
        clientId: client.id,
        issueDate,
        dueDate,
        status,
        subtotal,
        discountType,
        discountValue,
        discount: discountAmount,
        taxTotal,
        total,
        currency: data.currency || CurrencyEnum.EGP,
        language: data.language || LanguageEnum.EN,
        notes: data.notes || null,
        paymentTerms: data.paymentTerms || null,
      },
      { transaction: t }
    );

    // 7. Create Invoice Items
    if (processedItems.length > 0) {
      const itemsData = processedItems.map((pItem) => ({
        invoiceId: invoice.id,
        name: pItem.name,
        itemType: pItem.itemType,
        refId: pItem.refId,
        description: pItem.description,
        quantity: pItem.quantity,
        unitPrice: pItem.unitPrice,
        lineTotal: pItem.lineTotal,
      }));
      await InvoiceItem.bulkCreate(itemsData, { transaction: t });
    }

    // 8. Create Invoice Taxes
    if (invoiceTaxes.length > 0) {
      const invTaxesData = invoiceTaxes.map((tax) => ({
        invoiceId: invoice.id,
        taxId: tax.taxId,
        name: tax.name,
        rate: tax.rate,
        amount: tax.amount,
      }));
      await InvoiceTax.bulkCreate(invTaxesData, { transaction: t });
    }


    return invoice;
  });
};

/**
 * Lists and filters invoices by ID, client, status, date, and general search
 */
export const getAllInvoices = async (query = {}) => {
  const where = {};
  const clientWhere = {};

  // Exact ID
  if (query.id) {
    where.id = Number(query.id);
  }

  // Exact or pattern invoiceNumber
  if (query.invoiceNumber && query.invoiceNumber.trim()) {
    where.invoiceNumber = { [Op.like]: `%${query.invoiceNumber.trim()}%` };
  }

  // Client ID filter
  if (query.clientId) {
    where.clientId = Number(query.clientId);
  }

  // Status filter
  if (query.status && query.status.trim()) {
    where.status = query.status.trim();
  }

  // Issue date filter (exact or range)
  if (query.date || query.issueDate) {
    where.issueDate = query.date || query.issueDate;
  } else if (query.startDate || query.endDate) {
    where.issueDate = {};
    if (query.startDate) where.issueDate[Op.gte] = query.startDate;
    if (query.endDate) where.issueDate[Op.lte] = query.endDate;
  }

  // Due date filter (exact or range)
  if (query.dueDate) {
    where.dueDate = query.dueDate;
  } else if (query.dueStartDate || query.dueEndDate) {
    where.dueDate = {};
    if (query.dueStartDate) where.dueDate[Op.gte] = query.dueStartDate;
    if (query.dueEndDate) where.dueDate[Op.lte] = query.dueEndDate;
  }

  // General search across invoice number, client details, notes
  if (query.search && query.search.trim()) {
    const term = `%${query.search.trim()}%`;
    where[Op.or] = [
      { invoiceNumber: { [Op.like]: term } },
      { notes: { [Op.like]: term } },
      { '$client.name$': { [Op.like]: term } },
      { '$client.company$': { [Op.like]: term } },
      { '$client.email$': { [Op.like]: term } },
    ];
  }

  // Pagination
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const { rows, count } = await Invoice.findAndCountAll({
    where,
    include: invoiceIncludes,
    order: [['id', 'DESC']],
    limit,
    offset,
    distinct: true,
  });

  // Check and update overdue status dynamically
  const todayStr = getTodayDateString();
  for (const inv of rows) {
    if (inv.status === InvoiceStatusEnum.SENT && inv.dueDate < todayStr) {
      inv.status = InvoiceStatusEnum.OVERDUE;
      await Invoice.update(
        { status: InvoiceStatusEnum.OVERDUE },
        { where: { id: inv.id } }
      );
    }
  }

  return {
    items: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit) || 1,
    },
  };
};

/**
 * Gets a single invoice by ID
 */
export const getInvoiceById = async (id) => {
  const invoice = await Invoice.findByPk(Number(id), {
    include: invoiceIncludes,
  });

  if (!invoice) {
    throw new Error('Invoice not found', { cause: 404 });
  }

  // Auto-flag overdue if due date passed and status is SENT
  const todayStr = getTodayDateString();
  if (invoice.status === InvoiceStatusEnum.SENT && invoice.dueDate < todayStr) {
    invoice.status = InvoiceStatusEnum.OVERDUE;
    await Invoice.update(
      { status: InvoiceStatusEnum.OVERDUE },
      { where: { id: invoice.id } }
    );
  }

  return invoice;
};

/**
 * Updates an invoice.
 * Sent invoices are locked; changes need cancel and reissue.
 */
export const updateInvoice = async (id, data) => {
  return await sequelize.transaction(async (t) => {
    const invoice = await Invoice.findByPk(Number(id), {
      include: invoiceIncludes,
      transaction: t,
    });

    if (!invoice) {
      throw new Error('Invoice not found', { cause: 404 });
    }

    // Locked check: Only DRAFT invoices can be edited directly
    if (invoice.status !== InvoiceStatusEnum.DRAFT) {
      throw new Error(
        `Sent invoices are locked; changes need cancel and reissue. (Current status: ${invoice.status})`,
        { cause: 400 }
      );
    }

    // Update Client if changed
    if (data.clientId !== undefined && data.clientId !== invoice.clientId) {
      const client = await Client.findByPk(data.clientId, { transaction: t });
      if (!client) {
        throw new Error(`Client with ID ${data.clientId} not found`, { cause: 404 });
      }
      invoice.clientId = client.id;
    }

    if (data.issueDate !== undefined) {
      invoice.issueDate = data.issueDate;
    }
    if (data.dueDate !== undefined) {
      invoice.dueDate = data.dueDate;
    }
    if (new Date(invoice.dueDate) < new Date(invoice.issueDate)) {
      throw new Error('Due date cannot be before issue date', { cause: 400 });
    }

    if (data.notes !== undefined) invoice.notes = data.notes;
    if (data.paymentTerms !== undefined) invoice.paymentTerms = data.paymentTerms;
    if (data.currency !== undefined) invoice.currency = data.currency;
    if (data.language !== undefined) invoice.language = data.language;

    // If items, discount, or taxes are provided, recalculate
    if (
      data.items !== undefined ||
      data.discountValue !== undefined ||
      data.discountType !== undefined ||
      data.taxIds !== undefined
    ) {
      const itemsToProcess = data.items
        ? data.items
        : (invoice.items || []).map((it) => ({
          itemType: it.itemType,
          refId: it.refId,
          description: it.description,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        }));

      const targetDiscountValue =
        data.discountValue !== undefined ? data.discountValue : invoice.discountValue;
      const targetDiscountType =
        data.discountType !== undefined ? data.discountType : invoice.discountType;
      const targetTaxIds =
        data.taxIds !== undefined
          ? data.taxIds
          : (invoice.taxes || []).map((t) => t.taxId);

      const {
        processedItems,
        subtotal,
        taxTotal,
        invoiceTaxes,
        discountAmount,
        discountValue,
        discountType,
        total,
      } = await calculateInvoiceItemsAndTaxes(
        itemsToProcess,
        {
          discountValue: targetDiscountValue,
          discountType: targetDiscountType,
          taxIds: targetTaxIds,
        },
        t
      );

      invoice.subtotal = subtotal;
      invoice.discountType = discountType;
      invoice.discountValue = discountValue;
      invoice.discount = discountAmount;
      invoice.taxTotal = taxTotal;
      invoice.total = total;

      // Re-create items
      await InvoiceItem.destroy({
        where: { invoiceId: invoice.id },
        transaction: t,
      });

      // Remove old invoice taxes
      await InvoiceTax.destroy({
        where: { invoiceId: invoice.id },
        transaction: t,
      });

      // Insert new items
      if (processedItems.length > 0) {
        const itemsData = processedItems.map((pItem) => ({
          invoiceId: invoice.id,
          name: pItem.name,
          itemType: pItem.itemType,
          refId: pItem.refId,
          description: pItem.description,
          quantity: pItem.quantity,
          unitPrice: pItem.unitPrice,
          lineTotal: pItem.lineTotal,
        }));
        await InvoiceItem.bulkCreate(itemsData, { transaction: t });
      }

      // Insert new invoice taxes
      if (invoiceTaxes.length > 0) {
        const invTaxesData = invoiceTaxes.map((tax) => ({
          invoiceId: invoice.id,
          taxId: tax.taxId,
          name: tax.name,
          rate: tax.rate,
          amount: tax.amount,
        }));
        await InvoiceTax.bulkCreate(invTaxesData, { transaction: t });
      }
    }

    await invoice.save({ transaction: t });

    return invoice;
  });
};

/**
 * Updates status of an invoice manually based on business rules:
 * - Allowed transitions:
 *     DRAFT   -> OVERDUE
 *     OVERDUE -> PAID
 * - Cancellation (DRAFT -> CANCELLED, OVERDUE -> CANCELLED) must be performed exclusively via cancelInvoice().
 * - DRAFT -> SENT is disallowed here (handled via the email sending flow).
 * - SENT invoices are locked (changes need cancel and reissue).
 * - PAID and CANCELLED are terminal states (cannot change status).
 */
export const updateInvoiceStatus = async (id, newStatus) => {
  return await sequelize.transaction(async (t) => {
    const invoice = await Invoice.findByPk(Number(id), {
      transaction: t,
    });

    if (!invoice) {
      throw new Error('Invoice not found', { cause: 404 });
    }

    // 1. DRAFT -> SENT is disallowed here (reserved for email sending flow)
    if (newStatus === InvoiceStatusEnum.SENT) {
      throw new Error(
        'Invoices cannot be transitioned to SENT directly. Invoices are transitioned to SENT only upon sending.',
        { cause: 400 }
      );
    }

    // 2. Cancellation is handled exclusively through cancelInvoice()
    if (newStatus === InvoiceStatusEnum.CANCELLED) {
      throw new Error(
        'Cannot cancel an invoice through updateInvoiceStatus. Use cancelInvoice instead.',
        { cause: 400 }
      );
    }

    // 3. Terminal and locked states
    if (invoice.status === InvoiceStatusEnum.PAID) {
      throw new Error('Paid invoices cannot change status', { cause: 400 });
    }

    if (invoice.status === InvoiceStatusEnum.CANCELLED) {
      throw new Error('Cancelled invoices cannot change status', { cause: 400 });
    }

    if (invoice.status === InvoiceStatusEnum.SENT) {
      throw new Error(
        'Sent invoices are locked; changes need cancel and reissue.',
        { cause: 400 }
      );
    }

    // 4. Allowed transitions: DRAFT -> OVERDUE and OVERDUE -> PAID
    if (invoice.status === InvoiceStatusEnum.DRAFT) {
      if (newStatus !== InvoiceStatusEnum.OVERDUE) {
        throw new Error(
          `Cannot change status of a DRAFT invoice to "${newStatus}". Only OVERDUE is allowed via status update.`,
          { cause: 400 }
        );
      }
    } else if (invoice.status === InvoiceStatusEnum.OVERDUE) {
      if (newStatus !== InvoiceStatusEnum.PAID) {
        throw new Error(
          `Cannot change status of an OVERDUE invoice to "${newStatus}". Only PAID is allowed via status update.`,
          { cause: 400 }
        );
      }
    }

    invoice.status = newStatus;
    await invoice.save({ transaction: t });

    return true;
  });
};

/**
 * Cancels an invoice.
 */
export const cancelInvoice = async (id) => {
  const invoice = await Invoice.findByPk(Number(id));

  if (!invoice) {
    throw new Error('Invoice not found', { cause: 404 });
  }
  if (
    invoice.status === InvoiceStatusEnum.SENT ||
    invoice.status === InvoiceStatusEnum.PAID ||
    invoice.status === InvoiceStatusEnum.CANCELLED
  ) {
    throw new Error(
      'Cannot cancel a sent or paid or cancelled invoice. Only draft or overdue invoices can be cancelled.',
      { cause: 400 }
    );
  }

  invoice.status = InvoiceStatusEnum.CANCELLED;
  await invoice.save();

  return true;
};

/**
 * Deletes an invoice (only allowed for DRAFT or CANCELLED invoices)
 */
export const deleteInvoice = async (id) => {
  const invoice = await Invoice.findByPk(Number(id));

  if (!invoice) {
    throw new Error('Invoice not found', { cause: 404 });
  }

  if (
    invoice.status !== InvoiceStatusEnum.DRAFT &&
    invoice.status !== InvoiceStatusEnum.CANCELLED
  ) {
    throw new Error(
      `Cannot delete an invoice with status "${invoice.status}". Only DRAFT or CANCELLED invoices can be deleted.`,
      { cause: 400 }
    );
  }

  return await sequelize.transaction(async (t) => {
    await InvoiceItem.destroy({
      where: { invoiceId: invoice.id },
      transaction: t,
    });

    await InvoiceTax.destroy({
      where: { invoiceId: invoice.id },
      transaction: t,
    });

    await invoice.destroy({ transaction: t });
    return true;
  });
};

/**
 * Generates and returns a PDF buffer for an invoice, storing a copy temporarily for preview/actions
 */
export const previewInvoicePdf = async (id) => {
  const invoice = await getInvoiceById(id);
  const invoiceForPdf = invoice.toJSON ? invoice.toJSON() : { ...invoice };
  if (invoiceForPdf.status === InvoiceStatusEnum.DRAFT) {
    invoiceForPdf.status = InvoiceStatusEnum.SENT;
  }
  const pdfBuffer = await generateInvoicePDFBuffer(invoiceForPdf);
  const { tempPdfId, expiresAt, expiresInSeconds } = await tempPdfService.saveTempPdf(pdfBuffer, invoice.id);

  return {
    pdfBuffer,
    invoiceNumber: invoice.invoiceNumber,
    filename: `invoice-${invoice.invoiceNumber}.pdf`,
    tempPdfId,
    expiresAt,
    expiresInSeconds,
    invoiceId: invoice.id,
  };
};

export default {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  updateInvoiceStatus,
  cancelInvoice,
  deleteInvoice,
  previewInvoicePdf,
};
