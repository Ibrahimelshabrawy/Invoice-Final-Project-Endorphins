import { z } from 'zod';

export const createTaxSchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Tax name is required' })
      .trim()
      .min(1, 'Tax name cannot be empty')
      .max(100, 'Tax name cannot exceed 100 characters'),
    rate: z
      .coerce
      .number({ required_error: 'Tax rate is required' })
      .min(0, 'Tax rate cannot be negative')
      .max(100, 'Tax rate cannot exceed 100'),
    isActive: z.boolean().optional(),
  }),
};

export const updateTaxSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid tax ID'),
  }),
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Tax name cannot be empty')
      .max(100, 'Tax name cannot exceed 100 characters')
      .optional(),
    rate: z
      .coerce
      .number()
      .min(0, 'Tax rate cannot be negative')
      .max(100, 'Tax rate cannot exceed 100')
      .optional(),
    isActive: z.boolean().optional(),
  }),
};

export const taxParamSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid tax ID'),
  }),
};

export const taxQuerySchema = {
  query: z.object({
    isActive: z.enum(['true', 'false']).optional(),
    search: z.string().optional(),
  }).optional(),
};

export default {
  createTaxSchema,
  updateTaxSchema,
  taxParamSchema,
  taxQuerySchema,
};
