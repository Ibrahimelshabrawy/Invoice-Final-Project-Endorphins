import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authentication } from '../middlewares/authentication.middleware.js';
import { Validation } from '../middlewares/validation.middleware.js';
import { loginSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/login', Validation(loginSchema), authController.login);
router.post('/logout', authentication, authController.logout);
router.get('/me', authentication, authController.me);


export default router;
