import { Router } from 'express';
import * as invoiceController from '../controllers/invoice.controller.js';
import { authenticate } from '../middlewares/authentication.middleware.js';
import { Validate } from '../middlewares/validation.middleware.js';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceParamSchema,
  invoiceQuerySchema,
  updateInvoiceStatusSchema,
} from '../schemas/invoice.schema.js';

const router = Router();

// List, search, and filter invoices
router.get('/', authenticate, Validate(invoiceQuerySchema), invoiceController.getAllInvoices);

// Create a new invoice
router.post('/', authenticate, Validate(createInvoiceSchema), invoiceController.createInvoice);

// Get single invoice
router.get('/:id', authenticate, Validate(invoiceParamSchema), invoiceController.getInvoiceById);

// Generate & download invoice PDF
router.get('/:id/pdf', authenticate, Validate(invoiceParamSchema), invoiceController.downloadInvoicePdf);

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
