import { Router } from 'express';
import categoryRoutes from './category.routes.js';
import authRoutes from './auth.routes.js';
import taxRoutes from './tax.routes.js';
import serviceRoutes from './service.routes.js';
import bundleRoutes from './bundle.routes.js';

const router = Router();

// Invoicing route group (/api/invoicing/*)
router.use('/categories', categoryRoutes);
router.use('/auth', authRoutes);
router.use('/taxes', taxRoutes);
router.use('/services', serviceRoutes);
router.use('/bundles', bundleRoutes);

export default router;
