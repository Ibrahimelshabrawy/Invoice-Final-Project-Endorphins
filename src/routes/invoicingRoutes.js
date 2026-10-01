import { Router } from 'express';
import categoryRoutes from './category.routes.js';
import authRoutes from './auth.routes.js';
import taxRoutes from './tax.routes.js';
import serviceRoutes from './service.routes.js';
import bundleRoutes from './bundle.routes.js';
import clientRoutes from './client.routes.js';
import invoiceRoutes from './invoice.routes.js';
import settingRoutes from './setting.routes.js';

const router = Router();

router.use('/categories', categoryRoutes);
router.use('/auth', authRoutes);
router.use('/taxes', taxRoutes);
router.use('/services', serviceRoutes);
router.use('/bundles', bundleRoutes);
router.use('/clients', clientRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/settings', settingRoutes);

export default router;
