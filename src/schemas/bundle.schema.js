import { z } from 'zod';

const serviceIdsSchema = z
  .array(
    z.coerce
      .number({ required_error: 'Service ID is required' })
      .int('Service ID must be an integer')
      .positive('Service ID must be a positive integer')
  )
  .min(1, 'Bundle must contain at least one service')
  .refine((items) => new Set(items).size === items.length, {
    message: 'Bundle cannot contain duplicate services',
  });

export const createBundleSchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Bundle name is required' })
      .trim()
      .min(1, 'Bundle name cannot be empty')
      .max(255, 'Bundle name cannot exceed 255 characters'),
    description: z.string().trim().nullable().optional(),
    price: z.coerce
      .number({ required_error: 'Bundle price is required' })
      .min(0, 'Bundle price must be non-negative'),
    serviceIds: serviceIdsSchema,
    isActive: z.boolean().optional(),
  }),
};

export const updateBundleSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid bundle ID'),
  }),
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(1, 'Bundle name cannot be empty')
        .max(255, 'Bundle name cannot exceed 255 characters')
        .optional(),
      description: z.string().trim().nullable().optional(),
      price: z.coerce
        .number()
        .min(0, 'Bundle price must be non-negative')
        .optional(),
      serviceIds: serviceIdsSchema.optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
};

export const bundleParamSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid bundle ID'),
  }),
};

export const bundleQuerySchema = {
  query: z
    .object({
      isActive: z.enum(['true', 'false']).optional(),
      search: z.string().optional(),
    })
    .optional(),
};

export default {
  createBundleSchema,
  updateBundleSchema,
  bundleParamSchema,
  bundleQuerySchema,
};
