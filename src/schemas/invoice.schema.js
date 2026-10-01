import { z } from 'zod';
import { InvoiceStatusEnum } from '../utils/enum/invoiceStatus.enum.js';
import { CurrencyEnum } from '../utils/enum/currency.enum.js';
import { LanguageEnum } from '../utils/enum/language.enum.js';
import { ItemTypeEnum } from '../utils/enum/itemType.enum.js';
import { DiscountTypeEnum } from '../utils/enum/discountType.enum.js';

const itemSchema = z.object({
  itemType: z.nativeEnum(ItemTypeEnum, {
    errorMap: () => ({ message: 'itemType must be SERVICE or BUNDLE' }),
  }),
  refId: z.coerce
    .number({ required_error: 'refId is required' })
    .int('refId must be an integer')
    .positive('refId must be a positive integer'),
  quantity: z.coerce
    .number({ required_error: 'Quantity is required' })
    .positive('Quantity must be greater than 0'),
});

export const createInvoiceSchema = {
  body: z
    .object({
      clientId: z.coerce
        .number({ required_error: 'Client ID is required' })
        .int('Client ID must be an integer')
        .positive('Client ID must be a positive integer'),
      issueDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'issueDate must be in YYYY-MM-DD format')
        .optional(),
      dueDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'dueDate must be in YYYY-MM-DD format')
        .optional(),
      status: z.nativeEnum(InvoiceStatusEnum).optional().default(InvoiceStatusEnum.DRAFT),
      notes: z.string().trim().nullable().optional(),
      paymentTerms: z.string().trim().nullable().optional(),
      currency: z.nativeEnum(CurrencyEnum).optional().default(CurrencyEnum.EGP),
      language: z.nativeEnum(LanguageEnum).optional().default(LanguageEnum.EN),
      discountValue: z.coerce
        .number()
        .min(0, 'Discount value must be non-negative')
        .optional(),
      discountType: z
        .nativeEnum(DiscountTypeEnum, {
          errorMap: () => ({ message: 'discountType must be PERCENTAGE or FIXED' }),
        })
        .optional(),
      taxIds: z
        .array(
          z.coerce
            .number()
            .int('Tax ID must be an integer')
            .positive('Tax ID must be a positive integer')
        )
        .optional(),
      items: z
        .array(itemSchema, { required_error: 'Items array is required' })
        .min(1, 'Invoice must contain at least one item'),
    })
    .refine(
      (data) => {
        if (data.issueDate && data.dueDate) {
          return new Date(data.dueDate) >= new Date(data.issueDate);
        }
        return true;
      },
      {
        message: 'dueDate cannot be earlier than issueDate',
        path: ['dueDate'],
      }
    )
    .refine(
      (data) => {
        if (data.discountValue && Number(data.discountValue) > 0 && !data.discountType) {
          return false;
        }
        return true;
      },
      {
        message: 'discountType is required when discountValue is greater than 0',
        path: ['discountType'],
      }
    ),
};

export const updateInvoiceSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid invoice ID'),
  }),
  body: z
    .object({
      clientId: z.coerce
        .number()
        .int('Client ID must be an integer')
        .positive('Client ID must be a positive integer')
        .optional(),
      issueDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'issueDate must be in YYYY-MM-DD format')
        .optional(),
      dueDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'dueDate must be in YYYY-MM-DD format')
        .optional(),
      notes: z.string().trim().nullable().optional(),
      paymentTerms: z.string().trim().nullable().optional(),
      currency: z.nativeEnum(CurrencyEnum).optional(),
      language: z.nativeEnum(LanguageEnum).optional(),
      discountValue: z.coerce
        .number()
        .min(0, 'Discount value must be non-negative')
        .nullable()
        .optional(),
      discountType: z
        .nativeEnum(DiscountTypeEnum, {
          errorMap: () => ({ message: 'discountType must be PERCENTAGE or FIXED' }),
        })
        .nullable()
        .optional(),
      taxIds: z
        .array(
          z.coerce
            .number()
            .int('Tax ID must be an integer')
            .positive('Tax ID must be a positive integer')
        )
        .optional(),
      items: z.array(itemSchema).min(1, 'Items array cannot be empty').optional(),
    })
    .refine(
      (data) => Object.keys(data).length > 0,
      {
        message: 'At least one field must be provided for update',
      }
    )
    .refine(
      (data) => {
        if (data.issueDate && data.dueDate) {
          return new Date(data.dueDate) >= new Date(data.issueDate);
        }
        return true;
      },
      {
        message: 'dueDate cannot be earlier than issueDate',
        path: ['dueDate'],
      }
    )
    .refine(
      (data) => {
        if (data.discountValue && Number(data.discountValue) > 0 && !data.discountType) {
          return false;
        }
        return true;
      },
      {
        message: 'discountType is required when discountValue is greater than 0',
        path: ['discountType'],
      }
    ),
};

export const invoiceParamSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid invoice ID'),
  }),
};

export const updateInvoiceStatusSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid invoice ID'),
  }),
  body: z.object({
    status: z.nativeEnum(InvoiceStatusEnum, {
      required_error: 'Status is required',
    }),
  }),
};

export const reissueInvoiceSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid invoice ID'),
  }),
  body: z
    .object({
      issueDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'issueDate must be in YYYY-MM-DD format')
        .optional(),
      dueDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'dueDate must be in YYYY-MM-DD format')
        .optional(),
      notes: z.string().trim().nullable().optional(),
      paymentTerms: z.string().trim().nullable().optional(),
      discountValue: z.coerce.number().min(0).nullable().optional(),
      discountType: z.nativeEnum(DiscountTypeEnum).nullable().optional(),
      taxIds: z.array(z.coerce.number().int().positive()).optional(),
      items: z.array(itemSchema).min(1).optional(),
    })
    .optional(),
};

export const invoiceQuerySchema = {
  query: z
    .object({
      search: z.string().optional(),
      id: z.string().optional(),
      invoiceNumber: z.string().optional(),
      clientId: z.string().optional(),
      status: z.string().optional(),
      date: z.string().optional(),
      issueDate: z.string().optional(),
      dueDate: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      dueStartDate: z.string().optional(),
      dueEndDate: z.string().optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    })
    .optional(),
};

export default {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceParamSchema,
  updateInvoiceStatusSchema,
  reissueInvoiceSchema,
  invoiceQuerySchema,
};
