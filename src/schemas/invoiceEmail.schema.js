import { z } from 'zod';

export const sendInvoiceSchema = {
  params: z.object({
    id: z.coerce
      .number({ required_error: 'Invoice ID is required' })
      .int('Invoice ID must be an integer')
      .positive('Invoice ID must be a positive integer'),
  }),
  body: z.object({
    language: z.enum(['EN', 'AR'], {
      errorMap: () => ({ message: 'Language must be EN or AR' }),
    }),
    tempPdfId: z
      .string({ required_error: 'Temporary PDF ID is required' })
      .min(1, 'Temporary PDF ID cannot be empty'),
    cc: z
      .union([
        z.array(z.string().email('Invalid email address in CC')),
        z.string().email('Invalid email address in CC').transform((val) => [val]),
      ])
      .optional(),
  }),
};

export const discardInvoiceSchema = {
  params: z
    .object({
      id: z.coerce
        .number({ required_error: 'Invoice ID is required' })
        .int('Invoice ID must be an integer')
        .positive('Invoice ID must be a positive integer')
        .optional(),
    })
    .optional(),
  body: z
    .object({
      tempPdfId: z
        .string({ required_error: 'Temporary PDF ID is required' })
        .min(1, 'Temporary PDF ID cannot be empty')
        .optional(),
    })
    .optional(),
  query: z
    .object({
      tempPdfId: z.string().optional(),
    })
    .optional(),
};

export const retryEmailSchema = {
  params: z.object({
    id: z.coerce
      .number({ required_error: 'Email log ID is required' })
      .int('Email log ID must be an integer')
      .positive('Email log ID must be a positive integer'),
  }),
  body: z.object({
    language: z.enum(['EN', 'AR'], {
      errorMap: () => ({ message: 'Language must be EN or AR' }),
    }),
    tempPdfId: z
      .string({ required_error: 'Temporary PDF ID is required' })
      .min(1, 'Temporary PDF ID cannot be empty'),
  }),
};

export const invoiceEmailLogsSchema = {
  params: z.object({
    id: z.coerce
      .number({ required_error: 'Invoice ID is required' })
      .int('Invoice ID must be an integer')
      .positive('Invoice ID must be a positive integer'),
  }),
};

export default {
  sendInvoiceSchema,
  discardInvoiceSchema,
  retryEmailSchema,
  invoiceEmailLogsSchema,
};
