import { Op } from 'sequelize';
import { Bundle, Service, InvoiceItem } from '../models/index.js';
import { ItemTypeEnum } from '../utils/enum/itemType.enum.js';
import { validateServiceIds } from '../utils/bundle.util.js';


export const createBundle = async ({
  name,
  description = null,
  price,
  serviceIds,
  isActive = true,
}) => {
  console.log(serviceIds);

  const validatedIds = await validateServiceIds(serviceIds);

  const bundle = await Bundle.create({
    name: name.trim(),
    description: description ? description.trim() : null,
    price: Number(price),
    serviceIds: validatedIds,
    isActive,
  });

  return bundle;
};

export const getAllBundles = async (query = {}) => {
  const where = {};

  if (query.isActive !== undefined) {
    where.isActive = query.isActive === 'true' || query.isActive === true;
  }

  if (query.search) {
    where.name = { [Op.like]: `%${query.search.trim()}%` };
  }

  const bundles = await Bundle.findAll({
    where,
    order: [['id', 'ASC']],
  });

  const allServiceIds = [...new Set(bundles.flatMap((b) => b.serviceIds || []))];
  const services = allServiceIds.length > 0
    ? await Service.findAll({ where: { id: { [Op.in]: allServiceIds } } })
    : [];

  const serviceMap = new Map(services.map((s) => [s.id, s]));

  bundles.forEach((b) => {
    const bundleServices = (b.serviceIds || []).map((id) => serviceMap.get(id)).filter(Boolean);
    b.setDataValue('services', bundleServices);
  });

  return bundles;
};

export const getBundleById = async (id) => {
  const bundle = await Bundle.findByPk(Number(id));

  if (!bundle) {
    throw new Error('Bundle not found', { cause: 404 });
  }

  const services = (bundle.serviceIds && bundle.serviceIds.length > 0)
    ? await Service.findAll({ where: { id: { [Op.in]: bundle.serviceIds } } })
    : [];

  bundle.setDataValue('services', services);

  return bundle;
};

export const updateBundle = async (id, data) => {
  const bundle = await Bundle.findByPk(Number(id));

  if (!bundle) {
    throw new Error('Bundle not found', { cause: 404 });
  }

  if (data.name !== undefined) {
    bundle.name = data.name.trim();
  }

  if (data.description !== undefined) {
    bundle.description = data.description ? data.description.trim() : null;
  }

  if (data.price !== undefined) {
    bundle.price = Number(data.price);
  }

  const incomingServiceIds = data.serviceIds !== undefined ? data.serviceIds : data.service_ids;
  if (incomingServiceIds !== undefined) {
    const validatedIds = await validateServiceIds(incomingServiceIds);
    bundle.serviceIds = validatedIds;
  }

  if (data.isActive !== undefined) {
    bundle.isActive = data.isActive;
  }

  await bundle.save();

  return bundle;
};

export const deactivateBundle = async (id) => {
  const bundle = await Bundle.findByPk(Number(id));

  if (!bundle) {
    throw new Error('Bundle not found', { cause: 404 });
  }

  bundle.isActive = false;
  await bundle.save();

  return bundle;
};

export const activateBundle = async (id) => {
  const bundle = await Bundle.findByPk(Number(id));

  if (!bundle) {
    throw new Error('Bundle not found', { cause: 404 });
  }

  if (bundle.serviceIds && Array.isArray(bundle.serviceIds) && bundle.serviceIds.length > 0) {
    const constituentServices = await Service.findAll({
      where: { id: { [Op.in]: bundle.serviceIds } },
    });
    const inactiveServices = constituentServices.filter((s) => !s.isActive);
    if (inactiveServices.length > 0) {
      const inactiveNames = inactiveServices.map((s) => `"${s.name}" (ID: ${s.id})`).join(', ');
      throw new Error(
        `Cannot activate bundle because constituent service(s) are inactive: ${inactiveNames}`,
        { cause: 400 }
      );
    }
  }

  bundle.isActive = true;
  await bundle.save();

  return bundle;
};

export const deleteBundle = async (id) => {
  const bundle = await Bundle.findByPk(Number(id));

  if (!bundle) {
    throw new Error('Bundle not found', { cause: 404 });
  }

  const invoiceItemsCount = await InvoiceItem.count({
    where: {
      itemType: ItemTypeEnum.BUNDLE,
      refId: bundle.id,
    },
  });

  if (invoiceItemsCount > 0) {
    throw new Error(
      'Bundle has associated invoices and cannot be deleted. It must be deactivated instead.',
      { cause: 400 }
    );
  }

  await bundle.destroy();

  return true;
};

export default {
  createBundle,
  getAllBundles,
  getBundleById,
  updateBundle,
  deactivateBundle,
  activateBundle,
  deleteBundle,
};
