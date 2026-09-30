import { z } from 'zod';
import { DiscountTypeEnum } from '../utils/enum/discountType.enum.js';
import { CouponScopeEnum } from '../utils/enum/couponScope.enum.js';

export const createCouponSchema = {
  body: z
    .object({
      code: z
        .string({ required_error: 'Coupon code is required' })
        .trim()
        .min(1, 'Coupon code cannot be empty')
        .max(100, 'Coupon code cannot exceed 100 characters')
        .transform((val) => val.toUpperCase()),
      discountType: z.enum(
        [DiscountTypeEnum.PERCENTAGE, DiscountTypeEnum.FIXED],
        { required_error: 'Discount type is required' }
      ),
      discountValue: z.coerce
        .number({ required_error: 'Discount value is required' })
        .positive('Discount value must be greater than zero'),
      scope: z.enum([CouponScopeEnum.INVOICE, CouponScopeEnum.SERVICE], {
        required_error: 'Coupon scope is required',
      }),
      maxUses: z.coerce
        .number({ required_error: 'Max uses is required' })
        .int('Max uses must be an integer')
        .positive('Max uses must be greater than zero'),
      isActive: z.boolean().optional(),
      serviceIds: z
        .array(
          z.coerce
            .number()
            .int('Service ID must be an integer')
            .positive('Service ID must be a positive integer')
        )
        .optional(),
    })
    .refine(
      (data) => {
        if (data.discountType === DiscountTypeEnum.PERCENTAGE) {
          return data.discountValue <= 100;
        }
        return true;
      },
      {
        message: 'Percentage discount cannot exceed 100%',
        path: ['discountValue'],
      }
    )
    .refine(
      (data) => {
        if (data.scope === CouponScopeEnum.SERVICE) {
          return Array.isArray(data.serviceIds) && data.serviceIds.length > 0;
        }
        return true;
      },
      {
        message: 'Service IDs are required when coupon scope is SERVICE',
        path: ['serviceIds'],
      }
    )
    .refine(
      (data) => {
        if (Array.isArray(data.serviceIds) && data.serviceIds.length > 0) {
          const uniqueIds = new Set(data.serviceIds.map(Number));
          return uniqueIds.size === data.serviceIds.length;
        }
        return true;
      },
      {
        message: 'Service IDs cannot contain duplicate values',
        path: ['serviceIds'],
      }
    ),
};

export const updateCouponSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid coupon ID'),
  }),
  body: z
    .object({
      code: z
        .string()
        .trim()
        .min(1, 'Coupon code cannot be empty')
        .max(100, 'Coupon code cannot exceed 100 characters')
        .transform((val) => val.toUpperCase())
        .optional(),
      discountType: z
        .enum([DiscountTypeEnum.PERCENTAGE, DiscountTypeEnum.FIXED])
        .optional(),
      discountValue: z.coerce
        .number()
        .positive('Discount value must be greater than zero')
        .optional(),
      scope: z
        .enum([CouponScopeEnum.INVOICE, CouponScopeEnum.SERVICE])
        .optional(),
      maxUses: z.coerce
        .number()
        .int('Max uses must be an integer')
        .positive('Max uses must be greater than zero')
        .optional(),
      isActive: z.boolean().optional(),
      serviceIds: z
        .array(
          z.coerce
            .number()
            .int('Service ID must be an integer')
            .positive('Service ID must be a positive integer')
        )
        .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    })
    .refine(
      (data) => {
        if (
          data.discountType === DiscountTypeEnum.PERCENTAGE &&
          data.discountValue !== undefined
        ) {
          return data.discountValue <= 100;
        }
        return true;
      },
      {
        message: 'Percentage discount cannot exceed 100%',
        path: ['discountValue'],
      }
    )
    .refine(
      (data) => {
        if (data.scope === CouponScopeEnum.SERVICE && data.serviceIds !== undefined) {
          return Array.isArray(data.serviceIds) && data.serviceIds.length > 0;
        }
        return true;
      },
      {
        message: 'Service IDs cannot be empty when scope is SERVICE',
        path: ['serviceIds'],
      }
    )
    .refine(
      (data) => {
        if (Array.isArray(data.serviceIds) && data.serviceIds.length > 0) {
          const uniqueIds = new Set(data.serviceIds.map(Number));
          return uniqueIds.size === data.serviceIds.length;
        }
        return true;
      },
      {
        message: 'Service IDs cannot contain duplicate values',
        path: ['serviceIds'],
      }
    ),
};

export const couponParamSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid coupon ID'),
  }),
};

export const couponQuerySchema = {
  query: z
    .object({
      search: z.string().optional(),
      code: z.string().optional(),
      isActive: z
        .enum(['true', 'false'])
        .or(z.boolean())
        .optional(),
      scope: z
        .enum([CouponScopeEnum.INVOICE, CouponScopeEnum.SERVICE])
        .optional(),
      discountType: z
        .enum([DiscountTypeEnum.PERCENTAGE, DiscountTypeEnum.FIXED])
        .optional(),
    })
    .optional(),
};

export const applyCouponSchema = {
  body: z
    .object({
      code: z
        .string({ required_error: 'Coupon code is required' })
        .trim()
        .min(1, 'Coupon code cannot be empty')
        .transform((val) => val.toUpperCase()),
      subtotal: z.coerce
        .number()
        .min(0, 'Subtotal cannot be negative')
        .optional(),
      items: z
        .array(
          z
            .object({
              itemType: z
                .enum(['SERVICE', 'BUNDLE'])
                .optional()
                .default('SERVICE'),
              refId: z.coerce.number().int().positive().optional(),
              serviceId: z.coerce.number().int().positive().optional(),
              bundleId: z.coerce.number().int().positive().optional(),
              quantity: z.coerce
                .number()
                .positive('Quantity must be greater than zero')
                .default(1),
            })
            .refine(
              (item) =>
                item.refId !== undefined ||
                item.serviceId !== undefined ||
                item.bundleId !== undefined,
              {
                message:
                  'Each item must specify refId, serviceId, or bundleId',
              }
            )
        )
        .optional(),
    })
    .refine(
      (data) =>
        data.subtotal !== undefined ||
        (Array.isArray(data.items) && data.items.length > 0),
      {
        message: 'Either subtotal or a list of items must be provided',
        path: ['items'],
      }
    ),
};

export default {
  createCouponSchema,
  updateCouponSchema,
  couponParamSchema,
  couponQuerySchema,
  applyCouponSchema,
};
