import * as categoryService from '../services/category.service.js';

export const createCategory = async (req, res) => {
  const category = await categoryService.createCategory(req.body);

  return res.status(201).json({
    message: 'Category created successfully',
    data: category,
  });
};

export const getAllCategories = async (req, res) => {
  const categories = await categoryService.getAllCategories(req.query);

  return res.status(200).json({
    message: 'Categories retrieved successfully',
    data: categories,
  });
};

export const getCategoryById = async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);

  return res.status(200).json({
    message: 'Category retrieved successfully',
    data: category,
  });
};

export const updateCategory = async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);

  return res.status(200).json({
    message: 'Category updated successfully',
    data: category,
  });
};

export const deactivateCategory = async (req, res) => {
  const category = await categoryService.deactivateCategory(req.params.id);

  return res.status(200).json({
    message: 'Category deactivated successfully',
    data: category,
  });
};

export const activateCategory = async (req, res) => {
  const category = await categoryService.activateCategory(req.params.id);

  return res.status(200).json({
    message: 'Category activated successfully',
    data: category,
  });
};

export const deleteCategory = async (req, res) => {
  await categoryService.deleteCategory(req.params.id);

  return res.status(200).json({
    message: 'Category deleted successfully',
  });
};

export const createSubcategoryUnderCategory = async (req, res) => {
  const subcategory = await categoryService.createSubcategory({
    parentId: req.params.categoryId,
    name: req.body.name,
    isActive: req.body.isActive,
  });

  return res.status(201).json({
    message: 'Subcategory created successfully',
    data: subcategory,
  });
};

export const getSubcategoriesByCategory = async (req, res) => {
  const subcategories = await categoryService.getSubcategoriesByCategory(req.params.categoryId);

  return res.status(200).json({
    message: 'Subcategories retrieved successfully',
    data: subcategories,
  });
};

export const getAllSubcategories = async (req, res) => {
  const subcategories = await categoryService.getAllSubcategories(req.query);

  return res.status(200).json({
    message: 'Subcategories retrieved successfully',
    data: subcategories,
  });
};


export default {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deactivateCategory,
  activateCategory,
  deleteCategory,
  createSubcategoryUnderCategory,
  getSubcategoriesByCategory,
  getAllSubcategories,
};
