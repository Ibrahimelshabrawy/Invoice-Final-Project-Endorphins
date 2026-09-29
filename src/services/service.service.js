import { Op } from 'sequelize';
import { Service, Category, Tax, InvoiceItem, BundleItem } from '../models/index.js';
import { ItemTypeEnum } from '../utils/enum/itemType.enum.js';
import { validateCategory, validateSubcategory, validateTax, serviceIncludes } from '../utils/services.util.js';


export const createService = async ({
  name,
  description,
  unitPrice,
  unitType,
  categoryId,
  subcategoryId = null,
  defaultTaxId = null,
  isActive = true,
}) => {
  const category = await validateCategory(categoryId);
  const subcategory = await validateSubcategory(subcategoryId, category.id);
  const tax = await validateTax(defaultTaxId);

  const service = await Service.create({
    name: name.trim(),
    description: description ? description.trim() : null,
    unitPrice: Number(unitPrice),
    unitType,
    categoryId: category.id,
    subcategoryId: subcategory ? subcategory.id : null,
    defaultTaxId: tax ? tax.id : null,
    isActive,
  });

  return service;
};


export const getAllServices = async (query = {}) => {
  const where = {};

  if (query.categoryId) {
    where.categoryId = Number(query.categoryId);
  }

  if (query.subcategoryId) {
    where.subcategoryId = Number(query.subcategoryId);
  }

  if (query.isActive !== undefined) {
    where.isActive = query.isActive === 'true' || query.isActive === true;
  }

  if (query.unitType) {
    where.unitType = query.unitType;
  }

  if (query.search) {
    where.name = { [Op.like]: `%${query.search.trim()}%` };
  }

  return await Service.findAll({
    where,
    include: serviceIncludes,
    order: [['id', 'ASC']],
  });
};


export const getServiceById = async (id) => {
  const service = await Service.findByPk(Number(id), {
    include: serviceIncludes,
  });

  if (!service) {
    throw new Error('Service not found', { cause: 404 });
  }

  return service;
};

export const updateService = async (id, data) => {
  const service = await Service.findByPk(Number(id));

  if (!service) {
    throw new Error('Service not found', { cause: 404 });
  }

  const targetCategoryId =
    data.categoryId !== undefined ? Number(data.categoryId) : service.categoryId;

  if (data.categoryId !== undefined) {
    await validateCategory(targetCategoryId);
    service.categoryId = targetCategoryId;
  }

  if (data.subcategoryId !== undefined) {
    if (data.subcategoryId === null) {
      service.subcategoryId = null;
    } else {
      const subcategory = await validateSubcategory(data.subcategoryId, targetCategoryId);
      service.subcategoryId = subcategory.id;
    }
  } else if (data.categoryId !== undefined && service.subcategoryId) {
    const existingSubcategory = await Category.findByPk(service.subcategoryId);
    if (existingSubcategory && existingSubcategory.parentId !== targetCategoryId) {
      throw new Error(
        'Existing subcategory does not belong to the newly selected category. Please update subcategoryId or set it to null.',
        { cause: 400 }
      );
    }
  }

  if (data.defaultTaxId !== undefined) {
    if (data.defaultTaxId === null) {
      service.defaultTaxId = null;
    } else {
      const tax = await validateTax(data.defaultTaxId);
      service.defaultTaxId = tax.id;
    }
  }

  if (data.name !== undefined) {
    service.name = data.name.trim();
  }

  if (data.description !== undefined) {
    service.description = data.description ? data.description.trim() : null;
  }

  if (data.unitPrice !== undefined) {
    service.unitPrice = Number(data.unitPrice);
  }

  if (data.unitType !== undefined) {
    service.unitType = data.unitType;
  }

  if (data.isActive !== undefined) {
    service.isActive = data.isActive;
  }

  await service.save();

  return service;
};


export const deactivateService = async (id) => {
  const service = await Service.findByPk(Number(id));

  if (!service) {
    throw new Error('Service not found', { cause: 404 });
  }

  service.isActive = false;
  await service.save();

  return service;
};


export const activateService = async (id) => {
  const service = await Service.findByPk(Number(id), {
    include: [{ model: Category, as: 'category' }],
  });

  if (!service) {
    throw new Error('Service not found', { cause: 404 });
  }

  if (service.category && !service.category.isActive) {
    throw new Error('Cannot activate service because its category is inactive', { cause: 400 });
  }

  service.isActive = true;
  await service.save();

  return service;
};

export const deleteService = async (id) => {
  const service = await Service.findByPk(Number(id));

  if (!service) {
    throw new Error('Service not found', { cause: 404 });
  }

  const invoiceItemsCount = await InvoiceItem.count({
    where: {
      itemType: ItemTypeEnum.SERVICE,
      refId: service.id,
    },
  });

  if (invoiceItemsCount > 0) {
    throw new Error(
      'Service has associated invoices and cannot be deleted. It must be deactivated instead.',
      { cause: 400 }
    );
  }

  const bundleItemsCount = await BundleItem.count({
    where: {
      serviceId: service.id,
    },
  });

  if (bundleItemsCount > 0) {
    throw new Error(
      'Service is used in bundles and cannot be deleted. It must be deactivated instead.',
      { cause: 400 }
    );
  }

  await service.destroy();
  return true;
};

export default {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deactivateService,
  activateService,
  deleteService,
};
