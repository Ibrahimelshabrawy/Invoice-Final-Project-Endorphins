import { Router } from 'express';
import categoryRoutes from './category.routes.js';
import authRoutes from './auth.routes.js';

const router = Router();

// Invoicing route group (/api/invoicing/*)
router.use('/categories', categoryRoutes);
router.use('/auth', authRoutes);

export default router;
