import * as couponService from '../services/coupon.service.js';

export const createCoupon = async (req, res) => {
  const coupon = await couponService.createCoupon(req.body);

  return res.status(201).json({
    message: 'Coupon created successfully',
    data: coupon,
  });
};

export const getAllCoupons = async (req, res) => {
  const coupons = await couponService.getAllCoupons(req.query);

  return res.status(200).json({
    message: 'Coupons retrieved successfully',
    data: coupons,
  });
};

export const getCouponById = async (req, res) => {
  const coupon = await couponService.getCouponById(req.params.id);

  return res.status(200).json({
    message: 'Coupon retrieved successfully',
    data: coupon,
  });
};

export const updateCoupon = async (req, res) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body);

  return res.status(200).json({
    message: 'Coupon updated successfully',
    data: coupon,
  });
};

export const deactivateCoupon = async (req, res) => {
  const coupon = await couponService.deactivateCoupon(req.params.id);

  return res.status(200).json({
    message: 'Coupon deactivated successfully',
    data: coupon,
  });
};

export const activateCoupon = async (req, res) => {
  const coupon = await couponService.activateCoupon(req.params.id);

  return res.status(200).json({
    message: 'Coupon activated successfully',
    data: coupon,
  });
};

export const deleteCoupon = async (req, res) => {
  await couponService.deleteCoupon(req.params.id);

  return res.status(200).json({
    message: 'Coupon deleted successfully',
  });
};

export const applyCoupon = async (req, res) => {
  const result = await couponService.applyCoupon(req.body);

  return res.status(200).json({
    message: 'Coupon applied successfully',
    data: result,
  });
};

export default {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deactivateCoupon,
  activateCoupon,
  deleteCoupon,
  applyCoupon,
};
