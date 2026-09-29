import { Op } from 'sequelize';
import { Bundle, BundleItem, Service, InvoiceItem, sequelize } from '../models/index.js';
import { ItemTypeEnum } from '../utils/enum/itemType.enum.js';
import { bundleIncludes, validateBundleServices } from '../utils/bundle.util.js';



/**
 * Create a new Bundle with constituent services and quantities.
 *
 * Note on Fixed Bundle Price:
 * The bundle price is a fixed value explicitly set by the admin.
 * It is stored directly in the `bundles` table and is completely independent
 * of the underlying services' unit prices. Changing individual service prices
 * in the future will NOT alter this bundle price.
 */
export const createBundle = async ({
  name,
  description = null,
  price,
  isActive = true,
  services,
}) => {
  return await sequelize.transaction(async (t) => {
    await validateBundleServices(services, t);

    const bundle = await Bundle.create(
      {
        name: name.trim(),
        description: description ? description.trim() : null,
        price: Number(price),
        isActive,
      },
      { transaction: t }
    );

    const bundleItemsData = services.map((item) => ({
      bundleId: bundle.id,
      serviceId: Number(item.serviceId),
      quantity: Number(item.quantity),
    }));

    await BundleItem.bulkCreate(bundleItemsData, { transaction: t });

    return bundle;
  });
};

/**
 * Retrieve all Bundles with optional query filters (isActive, search).
 */
export const getAllBundles = async (query = {}) => {
  const where = {};

  if (query.isActive !== undefined) {
    where.isActive = query.isActive === 'true' || query.isActive === true;
  }

  if (query.search) {
    where.name = { [Op.like]: `%${query.search.trim()}%` };
  }

  return await Bundle.findAll({
    where,
    include: bundleIncludes,
    order: [['id', 'ASC']],
  });
};

/**
 * Retrieve a single Bundle by ID including its items and service details.
 */
export const getBundleById = async (id) => {
  const bundle = await Bundle.findByPk(Number(id), {
    include: bundleIncludes,
  });

  if (!bundle) {
    throw new Error('Bundle not found', { cause: 404 });
  }

  return bundle;
};

/**
 * Update an existing Bundle.
 *
 * Supports updating name, description, fixed price, active status,
 * and replacing the constituent services and their quantities.
 *
 * Note on Fixed Bundle Price:
 * Updating the price here sets a new fixed master price for the bundle.
 * It remains independent of individual service unit prices.
 */
export const updateBundle = async (id, data) => {
  return await sequelize.transaction(async (t) => {
    const bundle = await Bundle.findByPk(Number(id), { transaction: t });

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

    if (data.isActive !== undefined) {
      bundle.isActive = data.isActive;
    }

    if (data.services !== undefined) {
      await validateBundleServices(data.services, t);

      // Replace existing bundle items with the new set
      await BundleItem.destroy({
        where: { bundleId: bundle.id },
        transaction: t,
      });

      const bundleItemsData = data.services.map((item) => ({
        bundleId: bundle.id,
        serviceId: Number(item.serviceId),
        quantity: Number(item.quantity),
      }));

      await BundleItem.bulkCreate(bundleItemsData, { transaction: t });
    }

    await bundle.save({ transaction: t });

    return bundle;
  });
};

/**
 * Deactivate a Bundle.
 */
export const deactivateBundle = async (id) => {
  const bundle = await Bundle.findByPk(Number(id));

  if (!bundle) {
    throw new Error('Bundle not found', { cause: 404 });
  }

  bundle.isActive = false;
  await bundle.save();

  return bundle;
};

/**
 * Activate a Bundle.
 * Ensures that all constituent services in the bundle are currently active.
 */
export const activateBundle = async (id) => {
  const bundle = await Bundle.findByPk(Number(id), {
    include: [
      {
        model: BundleItem,
        as: 'bundleItems',
        include: [
          {
            model: Service,
            as: 'service',
            attributes: ['id', 'name', 'isActive'],
          },
        ],
      },
    ],
  });

  if (!bundle) {
    throw new Error('Bundle not found', { cause: 404 });
  }

  // Ensure all constituent services are active before activating bundle
  const inactiveServices = bundle.bundleItems
    ?.map((bi) => bi.service)
    .filter((s) => s && !s.isActive);

  if (inactiveServices && inactiveServices.length > 0) {
    const inactiveNames = inactiveServices.map((s) => `"${s.name}" (ID: ${s.id})`).join(', ');
    throw new Error(
      `Cannot activate bundle because constituent service(s) are inactive: ${inactiveNames}`,
      { cause: 400 }
    );
  }

  bundle.isActive = true;
  await bundle.save();

  return bundle;
};

/**
 * Delete a Bundle.
 * If the bundle is associated with existing invoices, deletion is safely blocked
 * and the bundle must be deactivated instead.
 */
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

  await sequelize.transaction(async (t) => {
    await BundleItem.destroy({
      where: { bundleId: bundle.id },
      transaction: t,
    });

    await bundle.destroy({ transaction: t });
  });

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
