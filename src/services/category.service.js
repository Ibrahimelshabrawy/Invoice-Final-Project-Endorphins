import { Op } from 'sequelize';
import { Category, Service } from '../models/index.js';

export const createCategory = async ({ name, isActive = true }) => {
  const category = await Category.create({
    name: name.trim(),
    parentId: null,
    isActive,
  });

  return category;
};

export const createSubcategory = async ({ parentId, name, isActive = true }) => {
  const parentCategory = await Category.findByPk(parentId);

  if (!parentCategory) {
    throw new Error('Parent category not found', { cause: 404 });
  }

  if (parentCategory.parentId !== null) {
    throw new Error('Cannot create a subcategory under another subcategory', { cause: 400 });
  }

  const subcategory = await Category.create({
    name: name.trim(),
    parentId: parentCategory.id,
    isActive,
  });

  return subcategory;
};

export const getAllCategories = async (query = {}) => {
  const where = { parentId: null };

  if (query.isActive !== undefined) {
    where.isActive = query.isActive === 'true' || query.isActive === true;
  }

  return await Category.findAll({
    where,
    include: [
      {
        model: Category,
        as: 'subcategories',
      },
    ],
    order: [
      ['id', 'ASC'],
      [{ model: Category, as: 'subcategories' }, 'id', 'ASC'],
    ],
  });
};

export const getCategoryById = async (id) => {
  const category = await Category.findByPk(id, {
    include: [
      {
        model: Category,
        as: 'subcategories',
      },
      {
        model: Category,
        as: 'parent',
      },
    ],
  });

  if (!category) {
    throw new Error('Category not found', { cause: 404 });
  }

  return category;
};

export const getAllSubcategories = async (query = {}) => {
  const where = { parentId: { [Op.ne]: null } };

  if (query.categoryId) {
    where.parentId = Number(query.categoryId);
  }

  if (query.isActive !== undefined) {
    where.isActive = query.isActive === 'true' || query.isActive === true;
  }

  return await Category.findAll({
    where,
    include: [
      {
        model: Category,
        as: 'parent',
      },
    ],
    order: [['id', 'ASC']],
  });
};

export const getSubcategoriesByCategory = async (categoryId) => {
  const parentCategory = await Category.findByPk(categoryId);

  if (!parentCategory) {
    throw new Error('Category not found', { cause: 404 });
  }

  return await Category.findAll({
    where: { parentId: categoryId },
    order: [['id', 'ASC']],
  });
};


export const updateCategory = async (id, { name, isActive }) => {
  const category = await Category.findByPk(id);

  if (!category) {
    throw new Error('Category not found', { cause: 404 });
  }

  if (name !== undefined) {
    category.name = name.trim();
  }

  if (isActive !== undefined) {
    category.isActive = isActive;
  }

  await category.save();
  return category;
};

export const deactivateCategory = async (id) => {
  const category = await Category.findByPk(id);

  if (!category) {
    throw new Error('Category not found', { cause: 404 });
  }

  category.isActive = false;
  await category.save();

  return category;
};

export const activateCategory = async (id) => {
  const category = await Category.findByPk(id);

  if (!category) {
    throw new Error('Category not found', { cause: 404 });
  }

  category.isActive = true;
  await category.save();

  return category;
};

export const deleteCategory = async (id) => {
  const category = await Category.findByPk(id);

  if (!category) {
    throw new Error('Category not found', { cause: 404 });
  }

  if (category.parentId === null) {
    const subcategoriesCount = await Category.count({
      where: { parentId: category.id },
    });

    if (subcategoriesCount > 0) {
      throw new Error(
        'Category has subcategories and cannot be deleted. It must be deactivated instead.',
        { cause: 400 }
      );
    }

    const servicesCount = await Service.count({
      where: { categoryId: category.id },
    });

    if (servicesCount > 0) {
      throw new Error(
        'Category has associated services and cannot be deleted. It must be deactivated instead.',
        { cause: 400 }
      );
    }
  } else {
    const servicesCount = await Service.count({
      where: {
        [Op.or]: [{ subcategoryId: category.id }, { categoryId: category.id }],
      },
    });

    if (servicesCount > 0) {
      throw new Error(
        'Subcategory has associated services and cannot be deleted. It must be deactivated instead.',
        { cause: 400 }
      );
    }
  }

  await category.destroy();
  return true;
};

export default {
  createCategory,
  createSubcategory,
  getAllCategories,
  getCategoryById,
  getAllSubcategories,
  getSubcategoriesByCategory,
  updateCategory,
  deactivateCategory,
  activateCategory,
  deleteCategory,
};
