import * as invoiceService from '../services/invoice.service.js';
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

export const downloadInvoicePdf = async (req, res) => {
  const { pdfBuffer, filename } = await invoiceService.downloadInvoicePdf(req.params.id);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Content-Length', pdfBuffer.length);

  return res.end(pdfBuffer);
};

export default {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  updateInvoiceStatus,
  cancelInvoice,
  deleteInvoice,
  downloadInvoicePdf,
};
