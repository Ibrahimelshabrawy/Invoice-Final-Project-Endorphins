import { Router } from 'express';
import * as emailLogController from '../controllers/emailLog.controller.js';
import { authenticate } from '../middlewares/authentication.middleware.js';
import { Validate } from '../middlewares/validation.middleware.js';
import { retryEmailSchema } from '../schemas/invoiceEmail.schema.js';

const router = Router();

// Retry sending a failed invoice email
router.post('/:id/retry', authenticate, Validate(retryEmailSchema), emailLogController.retryEmail);

export default router;
