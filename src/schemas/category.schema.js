import { z } from 'zod';

export const createCategorySchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Category name is required' })
      .trim()
      .min(1, 'Category name cannot be empty'),
    isActive: z.boolean().optional(),
  }),
};

export const updateCategorySchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid category ID'),
  }),
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Category name cannot be empty')
      .optional(),
    isActive: z.boolean().optional(),
  }),
};

export const createSubcategoryUnderCategorySchema = {
  params: z.object({
    categoryId: z.string().regex(/^\d+$/, 'Invalid category ID'),
  }),
  body: z.object({
    name: z
      .string({ required_error: 'Subcategory name is required' })
      .trim()
      .min(1, 'Subcategory name cannot be empty'),
    isActive: z.boolean().optional(),
  }),
};

export const categoryParamSchema = {
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid ID'),
  }),
};

export const parentCategoryParamSchema = {
  params: z.object({
    categoryId: z.string().regex(/^\d+$/, 'Invalid category ID'),
  }),
};

export default {
  createCategorySchema,
  updateCategorySchema,
  createSubcategoryUnderCategorySchema,
  categoryParamSchema,
  parentCategoryParamSchema,
};
