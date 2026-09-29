import { Router } from 'express';
import * as serviceController from '../controllers/service.controller.js';
import { authenticate } from '../middlewares/authentication.middleware.js';
import { Validate } from '../middlewares/validation.middleware.js';
import {
  createServiceSchema,
  updateServiceSchema,
  serviceParamSchema,
  serviceQuerySchema,
} from '../schemas/service.schema.js';

const router = Router();

// Service CRUD & Status Management
router.get('/', authenticate, Validate(serviceQuerySchema), serviceController.getAllServices);
router.post('/', authenticate, Validate(createServiceSchema), serviceController.createService);
router.get('/:id', authenticate, Validate(serviceParamSchema), serviceController.getServiceById);
router.patch('/:id', authenticate, Validate(updateServiceSchema), serviceController.updateService);
router.patch('/:id/deactivate', authenticate, Validate(serviceParamSchema), serviceController.deactivateService);
router.patch('/:id/activate', authenticate, Validate(serviceParamSchema), serviceController.activateService);
router.delete('/:id', authenticate, Validate(serviceParamSchema), serviceController.deleteService);

export default router;
