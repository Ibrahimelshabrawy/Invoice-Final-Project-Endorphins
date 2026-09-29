import { z } from 'zod';

const bundleItemInputSchema = z.object({
  serviceId: z.coerce
    .number({ required_error: 'Service ID is required' })
    .int('Service ID must be an integer')
    .positive('Service ID must be a positive integer'),
  quantity: z.coerce
    .number({ required_error: 'Quantity is required' })
    .positive('Quantity must be greater than zero'),
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
    isActive: z.boolean().optional(),
    services: z
      .array(bundleItemInputSchema, {
        required_error: 'Services array is required',
      })
      .min(1, 'Bundle must contain at least one service')
      .refine(
        (items) => {
          const ids = items.map((item) => Number(item.serviceId));
          return new Set(ids).size === ids.length;
        },
        {
          message: 'Bundle cannot contain duplicate services',
        }
      ),
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
      isActive: z.boolean().optional(),
      services: z
        .array(bundleItemInputSchema)
        .min(1, 'Bundle must contain at least one service')
        .refine(
          (items) => {
            const ids = items.map((item) => Number(item.serviceId));
            return new Set(ids).size === ids.length;
          },
          {
            message: 'Bundle cannot contain duplicate services',
          }
        )
        .optional(),
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
