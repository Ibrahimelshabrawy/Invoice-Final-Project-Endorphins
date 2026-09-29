import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';
import { authenticate } from '../middlewares/authentication.middleware.js';
import { Validate } from '../middlewares/validation.middleware.js';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryParamSchema,
  parentCategoryParamSchema,
  createSubcategoryUnderCategorySchema,
} from '../schemas/category.schema.js';

const router = Router();

// Category CRUD & Deactivation
router.get('/', authenticate, categoryController.getAllCategories);
router.get('/subcategories', authenticate, categoryController.getAllSubcategories);
router.post('/', authenticate, Validate(createCategorySchema), categoryController.createCategory);
router.get('/:id', authenticate, Validate(categoryParamSchema), categoryController.getCategoryById);
router.patch('/:id', authenticate, Validate(updateCategorySchema), categoryController.updateCategory);
router.patch('/:id/deactivate', authenticate, Validate(categoryParamSchema), categoryController.deactivateCategory);
router.patch('/:id/activate', authenticate, Validate(categoryParamSchema), categoryController.activateCategory);
router.delete('/:id', authenticate, Validate(categoryParamSchema), categoryController.deleteCategory);

// Subcategories under a category
router.post(
  '/:categoryId/subcategories',
  authenticate,
  Validate(createSubcategoryUnderCategorySchema),
  categoryController.createSubcategoryUnderCategory
);
router.get(
  '/:categoryId/subcategories',
  authenticate,
  Validate(parentCategoryParamSchema),
  categoryController.getSubcategoriesByCategory
);

export default router;
