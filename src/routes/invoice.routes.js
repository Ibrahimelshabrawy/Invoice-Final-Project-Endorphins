import { Router } from 'express';
import invoiceController from '../controllers/invoice.controller.js';
import { authenticate } from '../middlewares/authentication.middleware.js';
import { Validate } from '../middlewares/validation.middleware.js';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceParamSchema,
  invoiceQuerySchema,
  updateInvoiceStatusSchema,
} from '../schemas/invoice.schema.js';
import {
  sendInvoiceSchema,
  discardInvoiceSchema,
  invoiceEmailLogsSchema,
} from '../schemas/invoiceEmail.schema.js';

const router = Router();

// List, search, and filter invoices
router.get('/', authenticate, Validate(invoiceQuerySchema), invoiceController.getAllInvoices);

// Create a new invoice
router.post('/', authenticate, Validate(createInvoiceSchema), invoiceController.createInvoice);

// Discard temporary PDF without invoice ID in URL
router.post('/discard', authenticate, Validate(discardInvoiceSchema), invoiceController.discardInvoice);

// Get single invoice
router.get('/:id', authenticate, Validate(invoiceParamSchema), invoiceController.getInvoiceById);

// Generate & download / preview invoice PDF (sets X-Temp-Pdf-Id header)
router.get('/:id/pdf', authenticate, Validate(invoiceParamSchema), invoiceController.previewInvoicePdf);

// Generate preview info for invoice PDF (returns tempPdfId and filename)
router.post('/:id/preview', authenticate, Validate(invoiceParamSchema), invoiceController.previewInvoice);

// Discard temporary PDF
router.post('/:id/discard', authenticate, Validate(discardInvoiceSchema), invoiceController.discardInvoice);

// Send or resend invoice by email (returns 202 Accepted, processes via EventEmitter)
router.post('/:id/send', authenticate, Validate(sendInvoiceSchema), invoiceController.sendInvoice);

// Get invoice email logs
router.get('/:id/email-logs', authenticate, Validate(invoiceEmailLogsSchema), invoiceController.getInvoiceEmailLogs);

// Update draft invoice
router.patch('/:id', authenticate, Validate(updateInvoiceSchema), invoiceController.updateInvoice);

// Update status
router.patch(
  '/:id/status',
  authenticate,
  Validate(updateInvoiceStatusSchema),
  invoiceController.updateInvoiceStatus
);

// Actions / Shortcuts
router.post('/:id/cancel', authenticate, Validate(invoiceParamSchema), invoiceController.cancelInvoice);

// Delete draft/cancelled invoice
router.delete('/:id', authenticate, Validate(invoiceParamSchema), invoiceController.deleteInvoice);

export default router;
