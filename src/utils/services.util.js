import { Category } from '../models/index.js';

export const validateCategory = async (categoryId) => {
    const category = await Category.findByPk(Number(categoryId));

    if (!category) {
        throw new Error('Category not found', { cause: 404 });
    }

    if (category.parentId !== null) {
        throw new Error('categoryId must refer to a top-level category, not a subcategory', { cause: 400 });
    }

    if (!category.isActive) {
        throw new Error('Cannot assign an inactive category to a service', { cause: 400 });
    }

    return category;
};


export const validateSubcategory = async (subcategoryId, parentCategoryId) => {
    if (subcategoryId === null || subcategoryId === undefined) {
        return null;
    }

    const subcategory = await Category.findByPk(Number(subcategoryId));

    if (!subcategory) {
        throw new Error('Subcategory not found', { cause: 404 });
    }

    if (subcategory.parentId === null) {
        throw new Error('Provided subcategoryId is a top-level category, not a subcategory', { cause: 400 });
    }

    if (subcategory.parentId !== Number(parentCategoryId)) {
        throw new Error('Subcategory does not belong to the selected category', { cause: 400 });
    }

    if (!subcategory.isActive) {
        throw new Error('Cannot assign an inactive subcategory to a service', { cause: 400 });
    }

    return subcategory;
};

export const serviceIncludes = [
    {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'isActive'],
    },
    {
        model: Category,
        as: 'subcategory',
        attributes: ['id', 'name', 'isActive'],
    },
];
