import { Invoice, EmailLog } from '../models/index.js';
import { executeBackgroundSendInvoice } from '../utils/email.util.js';
import { emailEventEmitter } from '../utils/events/email.event.js';
import { EmailEnum } from '../utils/enum/email.enum.js';
import * as tempPdfService from './tempPdf.service.js';
import { EmailStatusEnum } from '../utils/enum/emailStatus.enum.js';
import { InvoiceStatusEnum } from '../utils/enum/invoiceStatus.enum.js';
import { invoiceIncludes } from '../utils/invoice.util.js';

const activeSendingInvoices = new Set();

/**
 * Sends an invoice by email using EventEmitter background processing.
 * Endpoint returns immediately with 202 Accepted.
 * 
 * @param {Object} data
 * @param {number|string} data.invoiceId
 * @param {string} data.tempPdfId
 * @param {string} [data.language='EN']
 * @param {Array<string>} [data.cc]
 */
export const sendInvoiceEmail = async ({ invoiceId, tempPdfId, language = 'EN', cc }) => {
  if (!tempPdfId || typeof tempPdfId !== 'string' || !tempPdfId.trim()) {
    const error = new Error('Temporary PDF ID is required. Please preview the PDF before sending.');
    error.cause = 400;
    throw error;
  }

  const numericInvoiceId = Number(invoiceId);

  // 1. Prevent duplicate concurrent sending for the same invoice
  if (activeSendingInvoices.has(numericInvoiceId)) {
    const error = new Error('An email is already being sent for this invoice. Please wait for it to complete.');
    error.cause = 400;
    throw error;
  }

  // 2. Validate that the temporary PDF exists, has not expired, and is not already in use
  const isValidPdf = await tempPdfService.isTempPdfValid(tempPdfId);
  if (!isValidPdf) {
    const error = new Error('Temporary PDF not found, expired, or already used. Please generate a new PDF.');
    error.cause = 400;
    throw error;
  }

  const invoice = await Invoice.findByPk(numericInvoiceId, {
    include: invoiceIncludes,
  });

  if (!invoice) {
    const error = new Error('Invoice not found');
    error.cause = 404;
    throw error;
  }

  if (invoice.status === InvoiceStatusEnum.CANCELLED) {
    const error = new Error('Cannot send a cancelled invoice');
    error.cause = 400;
    throw error;
  }

  const recipient = invoice.client?.email?.trim() || '';
  if (!recipient) {
    const error = new Error('Client does not have a valid email address');
    error.cause = 400;
    throw error;
  }

  // Lock both the temporary PDF and the invoice immediately to prevent duplicate sends
  tempPdfService.markTempPdfInUse(tempPdfId);
  activeSendingInvoices.add(numericInvoiceId);

  // Trigger background email sending via EventEmitter (non-blocking)
  emailEventEmitter.emit(EmailEnum.SEND_INVOICE, async () => {
    try {
      await executeBackgroundSendInvoice({
        invoice,
        recipient,
        cc,
        language: language || 'EN',
        tempPdfId,
      });
    } finally {
      activeSendingInvoices.delete(numericInvoiceId);
      tempPdfService.releaseTempPdfInUse(tempPdfId);
    }
  });

  return {
    message: 'Invoice email sending initiated',
    invoiceId: invoice.id,
    tempPdfId,
    status: 'ACCEPTED',
  };
};

/**
 * Discards temporary PDF immediately without sending email or logging.
 * 
 * @param {string} tempPdfId 
 */
export const discardInvoicePdf = async (tempPdfId) => {
  if (tempPdfId) {
    await tempPdfService.deleteTempPdf(tempPdfId);
  }

  return {
    message: 'Temporary invoice PDF discarded successfully',
    tempPdfId,
  };
};

/**
 * Retrieves all email logs for a specific invoice.
 * Exposes recipient, cc, sent time, status, error without credentials.
 * 
 * @param {number|string} invoiceId
 * @returns {Promise<Array<Object>>}
 */
export const getInvoiceEmailLogs = async (invoiceId) => {
  const invoice = await Invoice.findByPk(Number(invoiceId));

  if (!invoice) {
    const error = new Error('Invoice not found');
    error.cause = 404;
    throw error;
  }

  const logs = await EmailLog.findAll({
    where: { invoiceId: invoice.id },
    order: [['id', 'DESC']],
  });

  return logs.map((log) => ({
    id: log.id,
    invoiceId: log.invoiceId,
    recipient: log.recipient,
    cc: log.cc,
    sentAt: log.sentAt,
    status: log.status,
    error: log.error,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt,
  }));
};

/**
 * Retries sending a failed invoice email using the same sendInvoiceEmail logic.
 * 
 * @param {Object} data
 * @param {number|string} data.emailLogId
 * @param {string} data.tempPdfId
 * @param {string} [data.language='EN']
 */
export const retryInvoiceEmail = async ({ emailLogId, tempPdfId, language = 'EN' }) => {
  const log = await EmailLog.findByPk(Number(emailLogId));

  if (!log) {
    const error = new Error('Email log not found');
    error.cause = 404;
    throw error;
  }

  return await sendInvoiceEmail({
    invoiceId: log.invoiceId,
    tempPdfId,
    language,
    cc: log.cc,
  });
};

export default {
  sendInvoiceEmail,
  discardInvoicePdf,
  getInvoiceEmailLogs,
  retryInvoiceEmail,
};
