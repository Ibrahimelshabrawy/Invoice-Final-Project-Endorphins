import { z } from 'zod';
import CurrencyEnum from '../utils/enum/currency.enum.js';

export const updateSettingSchema = {
  body: z
    .object({
      companyName: z.string().trim().min(1, 'Company name cannot be empty').max(200).optional(),
      companyLogo: z.string().trim().optional(),
      companyAddress: z.string().trim().optional(),
      companyTaxNumber: z.string().trim().max(100).optional(),
      currency: z.enum([CurrencyEnum.EGP], {
        message: 'Currency must be EGP (single currency only)',
      }).optional(),
      invoiceNumberFormat: z.string().trim().min(1, 'Invoice number format cannot be empty').max(100).optional(),
      smtpHost: z.string().trim().optional(),
      smtpPort: z.coerce.number().int().min(1, 'Port must be at least 1').max(65535, 'Invalid SMTP port').optional(),
      smtpUser: z.string().trim().optional(),
      smtpPassword: z.string().optional(),
      smtpFromName: z.string().trim().max(100).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one setting field must be provided',
    }),
};

export default {
  updateSettingSchema,
};
