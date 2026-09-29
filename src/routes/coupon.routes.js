import { Router } from 'express';
import * as couponController from '../controllers/coupon.controller.js';
import { authenticate } from '../middlewares/authentication.middleware.js';
import { Validate } from '../middlewares/validation.middleware.js';
import {
  createCouponSchema,
  updateCouponSchema,
  couponParamSchema,
  couponQuerySchema,
  applyCouponSchema,
} from '../schemas/coupon.schema.js';

const router = Router();

router.get('/', authenticate, Validate(couponQuerySchema), couponController.getAllCoupons);
router.post('/', authenticate, Validate(createCouponSchema), couponController.createCoupon);
router.post('/apply', authenticate, Validate(applyCouponSchema), couponController.applyCoupon);
router.get('/:id', authenticate, Validate(couponParamSchema), couponController.getCouponById);
router.patch('/:id', authenticate, Validate(updateCouponSchema), couponController.updateCoupon);
router.patch('/:id/deactivate', authenticate, Validate(couponParamSchema), couponController.deactivateCoupon);
router.patch('/:id/activate', authenticate, Validate(couponParamSchema), couponController.activateCoupon);
router.delete('/:id', authenticate, Validate(couponParamSchema), couponController.deleteCoupon);

export default router;
