import { Router } from 'express';
import * as clientController from '../controllers/client.controller.js';
import { authenticate } from '../middlewares/authentication.middleware.js';
import { Validate } from '../middlewares/validation.middleware.js';
import {
  createClientSchema,
  updateClientSchema,
  clientParamSchema,
  clientQuerySchema,
} from '../schemas/client.schema.js';

const router = Router();

// Client CRUD & Searching
router.get('/', authenticate, Validate(clientQuerySchema), clientController.getAllClients);
router.post('/', authenticate, Validate(createClientSchema), clientController.createClient);
router.get('/:id', authenticate, Validate(clientParamSchema), clientController.getClientById);
router.patch('/:id', authenticate, Validate(updateClientSchema), clientController.updateClient);
router.delete('/:id', authenticate, Validate(clientParamSchema), clientController.deleteClient);

export default router;
