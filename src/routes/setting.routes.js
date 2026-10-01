import { Router } from 'express';
import * as settingController from '../controllers/setting.controller.js';
import { authenticate } from '../middlewares/authentication.middleware.js';
import { Validate } from '../middlewares/validation.middleware.js';
import { updateSettingSchema } from '../schemas/setting.schema.js';

const router = Router();

router.get('/', authenticate, settingController.getSettings);
router.patch('/', authenticate, Validate(updateSettingSchema), settingController.updateSettings);

export default router;
