import { Router } from 'express';
import categoryRoutes from './category.routes.js';
import authRoutes from './auth.routes.js';
import taxRoutes from './tax.routes.js';

const router = Router();

// Invoicing route group (/api/invoicing/*)
router.use('/categories', categoryRoutes);
router.use('/auth', authRoutes);
router.use('/taxes', taxRoutes);

export default router;
