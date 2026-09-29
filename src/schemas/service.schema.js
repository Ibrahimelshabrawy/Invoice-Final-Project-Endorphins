import { z } from 'zod';
import { UnitTypeEnum } from '../utils/enum/unitType.enum.js';

const unitTypeValues = Object.values(UnitTypeEnum);

export const createServiceSchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Service name is required' })
      .trim()
      .min(1, 'Service name cannot be empty')
      .max(255, 'Service name cannot exceed 255 characters'),
    description: z.string().trim().nullable().optional(),
    unitPrice: z.coerce
      .number({ required_error: 'Unit price is required' })
      .min(0, 'Unit price must be non-negative'),
    unitType: z.enum(unitTypeValues, {
      errorMap: () => ({ message: `Unit type must be one of: ${unitTypeValues.join(', ')}` }),
    }),
    categoryId: z.coerce
      .number({ required_error: 'Category ID is required' })
      .int('Category ID must be an integer')
      .positive('Category ID must be a positive integer'),
    subcategoryId: z.coerce
      .number()
      .int('Subcategory ID must be an integer')
      .positive('Subcategory ID must be a positive integer')
      .nullable()
      .optional(),
    defaultTaxId: z.coerce
      .number()
      .int('Default tax ID must be an integer')
      .positive('Default tax ID must be a positive integer')
      .nullable()
      .optional(),
    isActive: z.boolean().optional(),
  }),
};

export const updateServiceSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid service ID'),
  }),
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(1, 'Service name cannot be empty')
        .max(255, 'Service name cannot exceed 255 characters')
        .optional(),
      description: z.string().trim().nullable().optional(),
      unitPrice: z.coerce
        .number()
        .min(0, 'Unit price must be non-negative')
        .optional(),
      unitType: z
        .enum(unitTypeValues, {
          errorMap: () => ({ message: `Unit type must be one of: ${unitTypeValues.join(', ')}` }),
        })
        .optional(),
      categoryId: z.coerce
        .number()
        .int('Category ID must be an integer')
        .positive('Category ID must be a positive integer')
        .optional(),
      subcategoryId: z.coerce
        .number()
        .int('Subcategory ID must be an integer')
        .positive('Subcategory ID must be a positive integer')
        .nullable()
        .optional(),
      defaultTaxId: z.coerce
        .number()
        .int('Default tax ID must be an integer')
        .positive('Default tax ID must be a positive integer')
        .nullable()
        .optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
};

export const serviceParamSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid service ID'),
  }),
};

export const serviceQuerySchema = {
  query: z
    .object({
      categoryId: z.string().regex(/^\d+$/, 'Category ID must be numeric').optional(),
      subcategoryId: z.string().regex(/^\d+$/, 'Subcategory ID must be numeric').optional(),
      isActive: z.enum(['true', 'false']).optional(),
      unitType: z.enum(unitTypeValues).optional(),
      search: z.string().optional(),
    })
    .optional(),
};

export default {
  createServiceSchema,
  updateServiceSchema,
  serviceParamSchema,
  serviceQuerySchema,
};
