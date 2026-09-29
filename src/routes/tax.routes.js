import { Router } from 'express';
import * as taxController from '../controllers/tax.controller.js';
import { authenticate } from '../middlewares/authentication.middleware.js';
import { Validate } from '../middlewares/validation.middleware.js';
import {
  createTaxSchema,
  updateTaxSchema,
  taxParamSchema,
  taxQuerySchema,
} from '../schemas/tax.schema.js';

const router = Router();

// Tax CRUD & Status Management
router.get('/', authenticate, Validate(taxQuerySchema), taxController.getAllTaxes);
router.post('/', authenticate, Validate(createTaxSchema), taxController.createTax);
router.get('/:id', authenticate, Validate(taxParamSchema), taxController.getTaxById);
router.patch('/:id', authenticate, Validate(updateTaxSchema), taxController.updateTax);
router.patch('/:id/deactivate', authenticate, Validate(taxParamSchema), taxController.deactivateTax);
router.patch('/:id/activate', authenticate, Validate(taxParamSchema), taxController.activateTax);
router.delete('/:id', authenticate, Validate(taxParamSchema), taxController.deleteTax);

export default router;
