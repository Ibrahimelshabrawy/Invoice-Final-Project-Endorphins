import * as invoiceService from '../services/invoice.service.js';
import * as invoiceEmailService from '../services/invoiceEmail.service.js';
import { InvoiceStatusEnum } from '../utils/enum/invoiceStatus.enum.js';

export const createInvoice = async (req, res) => {
  const invoice = await invoiceService.createInvoice(req.body);

  return res.status(201).json({
    message: 'Invoice created successfully',
    data: invoice,
  });
};

export const getAllInvoices = async (req, res) => {
  const result = await invoiceService.getAllInvoices(req.query);

  return res.status(200).json({
    message: 'Invoices retrieved successfully',
    data: result.items,
    pagination: result.pagination,
  });
};

export const getInvoiceById = async (req, res) => {
  const invoice = await invoiceService.getInvoiceById(req.params.id);

  return res.status(200).json({
    message: 'Invoice retrieved successfully',
    data: invoice,
  });
};

export const updateInvoice = async (req, res) => {
  const invoice = await invoiceService.updateInvoice(req.params.id, req.body);

  return res.status(200).json({
    message: 'Invoice updated successfully',
    data: invoice,
  });
};

export const updateInvoiceStatus = async (req, res) => {
  await invoiceService.updateInvoiceStatus(req.params.id, req.body.status);

  return res.status(200).json({
    message: `Invoice status updated to ${req.body.status} successfully`,
  });
};

export const cancelInvoice = async (req, res) => {
  await invoiceService.cancelInvoice(req.params.id);

  return res.status(200).json({
    message: 'Invoice cancelled successfully',
  });
};

export const deleteInvoice = async (req, res) => {
  await invoiceService.deleteInvoice(req.params.id);

  return res.status(200).json({
    message: 'Invoice deleted successfully',
  });
};

export const previewInvoicePdf = async (req, res) => {
  const { pdfBuffer, filename, tempPdfId, expiresAt, expiresInSeconds } = await invoiceService.previewInvoicePdf(req.params.id);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  if (tempPdfId) {
    res.setHeader('X-Temp-Pdf-Id', tempPdfId);
    res.setHeader('X-Temp-Pdf-Expires-At', expiresAt);
    res.setHeader('X-Temp-Pdf-Expires-In-Seconds', String(expiresInSeconds));
    res.setHeader('Access-Control-Expose-Headers', 'X-Temp-Pdf-Id, X-Temp-Pdf-Expires-At, X-Temp-Pdf-Expires-In-Seconds');
  }

  return res.end(pdfBuffer);
};

export const previewInvoice = async (req, res) => {
  const result = await invoiceService.previewInvoicePdf(req.params.id);

  return res.status(200).json({
    message: 'Invoice PDF generated for preview',
    data: {
      tempPdfId: result.tempPdfId,
      expiresAt: result.expiresAt,
      expiresInSeconds: result.expiresInSeconds,
      filename: result.filename,
      invoiceId: result.invoiceId,
    },
  });
};

export const discardInvoice = async (req, res) => {
  const tempPdfId = req.body?.tempPdfId || req.query?.tempPdfId;
  const result = await invoiceEmailService.discardInvoicePdf(tempPdfId);

  return res.status(200).json({
    message: 'Temporary invoice PDF discarded successfully',
    data: result,
  });
};

export const sendInvoice = async (req, res) => {
  const result = await invoiceEmailService.sendInvoiceEmail({
    invoiceId: req.params.id,
    tempPdfId: req.body?.tempPdfId,
    language: req.body?.language,
    cc: req.body?.cc,
  });

  return res.status(202).json({
    message: 'Invoice email send request accepted',
    data: result,
  });
};

export const getInvoiceEmailLogs = async (req, res) => {
  const logs = await invoiceEmailService.getInvoiceEmailLogs(req.params.id);

  return res.status(200).json({
    message: 'Invoice email logs retrieved successfully',
    data: logs,
  });
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
  previewInvoice,
  discardInvoice,
  sendInvoice,
  getInvoiceEmailLogs,
};
