import { Op } from 'sequelize';
import { Tax, InvoiceTax } from '../models/index.js';

export const createTax = async ({ name, rate, isActive = true }) => {
  const tax = await Tax.create({
    name: name.trim(),
    rate,
    isActive,
  });

  return tax;
};

export const getAllTaxes = async (query = {}) => {
  const where = {};

  if (query.isActive !== undefined) {
    where.isActive = query.isActive === 'true' || query.isActive === true;
  }

  if (query.search) {
    where.name = { [Op.like]: `%${query.search.trim()}%` };
  }

  return await Tax.findAll({
    where,
    order: [['id', 'ASC']],
  });
};

export const getTaxById = async (id) => {
  const tax = await Tax.findByPk(id);

  if (!tax) {
    throw new Error('Tax not found', { cause: 404 });
  }

  return tax;
};

export const updateTax = async (id, { name, rate, isActive }) => {
  const tax = await Tax.findByPk(id);

  if (!tax) {
    throw new Error('Tax not found', { cause: 404 });
  }

  if (name !== undefined) {
    tax.name = name.trim();
  }

  if (rate !== undefined) {
    tax.rate = rate;
  }

  if (isActive !== undefined) {
    tax.isActive = isActive;
  }

  await tax.save();
  return tax;
};

export const deactivateTax = async (id) => {
  const tax = await Tax.findByPk(id);

  if (!tax) {
    throw new Error('Tax not found', { cause: 404 });
  }

  tax.isActive = false;
  await tax.save();

  return tax;
};

export const activateTax = async (id) => {
  const tax = await Tax.findByPk(id);

  if (!tax) {
    throw new Error('Tax not found', { cause: 404 });
  }

  tax.isActive = true;
  await tax.save();

  return tax;
};

export const deleteTax = async (id) => {
  const tax = await Tax.findByPk(id);

  if (!tax) {
    throw new Error('Tax not found', { cause: 404 });
  }

  const invoiceTaxesCount = await InvoiceTax.count({
    where: { taxId: tax.id },
  });

  if (invoiceTaxesCount > 0) {
    throw new Error(
      'Tax has associated invoices and cannot be deleted. It must be deactivated instead.',
      { cause: 400 }
    );
  }

  await tax.destroy();
  return true;
};

export default {
  createTax,
  getAllTaxes,
  getTaxById,
  updateTax,
  deactivateTax,
  activateTax,
  deleteTax,
};
