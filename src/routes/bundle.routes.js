import { Router } from 'express';
import * as bundleController from '../controllers/bundle.controller.js';
import { authenticate } from '../middlewares/authentication.middleware.js';
import { Validate } from '../middlewares/validation.middleware.js';
import {
  createBundleSchema,
  updateBundleSchema,
  bundleParamSchema,
  bundleQuerySchema,
} from '../schemas/bundle.schema.js';

const router = Router();

router.get('/', authenticate, Validate(bundleQuerySchema), bundleController.getAllBundles);
router.post('/', authenticate, Validate(createBundleSchema), bundleController.createBundle);
router.get('/:id', authenticate, Validate(bundleParamSchema), bundleController.getBundleById);
router.patch('/:id', authenticate, Validate(updateBundleSchema), bundleController.updateBundle);
router.patch('/:id/deactivate', authenticate, Validate(bundleParamSchema), bundleController.deactivateBundle);
router.patch('/:id/activate', authenticate, Validate(bundleParamSchema), bundleController.activateBundle);
router.delete('/:id', authenticate, Validate(bundleParamSchema), bundleController.deleteBundle);

export default router;
