import { z } from 'zod';

const optionalEmail = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
  z
    .string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email cannot exceed 255 characters')
    .nullable()
    .optional()
);

export const createClientSchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Client name is required' })
      .trim()
      .min(1, 'Client name cannot be empty')
      .max(255, 'Client name cannot exceed 255 characters'),
    company: z
      .string()
      .trim()
      .max(255, 'Company name cannot exceed 255 characters')
      .nullable()
      .optional(),
    email: optionalEmail,
    phone: z
      .string()
      .trim()
      .max(50, 'Phone number cannot exceed 50 characters')
      .nullable()
      .optional(),
    address: z.string().trim().nullable().optional(),
    taxNumber: z
      .string()
      .trim()
      .max(100, 'Tax number cannot exceed 100 characters')
      .nullable()
      .optional(),
  }),
};

export const updateClientSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid client ID'),
  }),
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(1, 'Client name cannot be empty')
        .max(255, 'Client name cannot exceed 255 characters')
        .optional(),
      company: z
        .string()
        .trim()
        .max(255, 'Company name cannot exceed 255 characters')
        .nullable()
        .optional(),
      email: optionalEmail,
      phone: z
        .string()
        .trim()
        .max(50, 'Phone number cannot exceed 50 characters')
        .nullable()
        .optional(),
      address: z.string().trim().nullable().optional(),
      taxNumber: z
        .string()
        .trim()
        .max(100, 'Tax number cannot exceed 100 characters')
        .nullable()
        .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
};

export const clientParamSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid client ID'),
  }),
};

export const clientQuerySchema = {
  query: z
    .object({
      search: z.string().optional(),
      name: z.string().optional(),
      company: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      taxNumber: z.string().optional(),
    })
    .optional(),
};

export default {
  createClientSchema,
  updateClientSchema,
  clientParamSchema,
  clientQuerySchema,
};
