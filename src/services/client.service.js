import { Op } from 'sequelize';
import { Client, Invoice } from '../models/index.js';

const normalizeString = (val) => {
  if (val === undefined) return undefined;
  if (val === null) return null;
  const trimmed = typeof val === 'string' ? val.trim() : val;
  return trimmed === '' ? null : trimmed;
};

export const createClient = async ({
  name,
  company = null,
  email = null,
  phone = null,
  address = null,
  taxNumber = null,
}) => {
  const client = await Client.create({
    name: name.trim(),
    company: normalizeString(company),
    email: normalizeString(email),
    phone: normalizeString(phone),
    address: normalizeString(address),
    taxNumber: normalizeString(taxNumber),
  });

  return client;
};

export const getAllClients = async (query = {}) => {
  const where = {};

  if (query.search && query.search.trim()) {
    const searchTerm = `%${query.search.trim()}%`;
    where[Op.or] = [
      { name: { [Op.like]: searchTerm } },
      { company: { [Op.like]: searchTerm } },
      { email: { [Op.like]: searchTerm } },
      { phone: { [Op.like]: searchTerm } },
      { taxNumber: { [Op.like]: searchTerm } },
    ];
  }

  if (query.name && query.name.trim()) {
    where.name = { [Op.like]: `%${query.name.trim()}%` };
  }

  if (query.company && query.company.trim()) {
    where.company = { [Op.like]: `%${query.company.trim()}%` };
  }

  if (query.email && query.email.trim()) {
    where.email = { [Op.like]: `%${query.email.trim()}%` };
  }

  if (query.phone && query.phone.trim()) {
    where.phone = { [Op.like]: `%${query.phone.trim()}%` };
  }

  if (query.taxNumber && query.taxNumber.trim()) {
    where.taxNumber = { [Op.like]: `%${query.taxNumber.trim()}%` };
  }

  return await Client.findAll({
    where,
    order: [['id', 'ASC']],
  });
};


export const getClientById = async (id) => {
  const client = await Client.findByPk(Number(id));

  if (!client) {
    throw new Error('Client not found', { cause: 404 });
  }

  return client;
};


export const updateClient = async (id, data) => {
  const client = await Client.findByPk(Number(id));

  if (!client) {
    throw new Error('Client not found', { cause: 404 });
  }

  if (data.name !== undefined) {
    client.name = data.name.trim();
  }

  if (data.company !== undefined) {
    client.company = normalizeString(data.company);
  }

  if (data.email !== undefined) {
    client.email = normalizeString(data.email);
  }

  if (data.phone !== undefined) {
    client.phone = normalizeString(data.phone);
  }

  if (data.address !== undefined) {
    client.address = normalizeString(data.address);
  }

  if (data.taxNumber !== undefined) {
    client.taxNumber = normalizeString(data.taxNumber);
  }

  await client.save();
  return client;
};

export const deleteClient = async (id) => {
  const client = await Client.findByPk(Number(id));

  if (!client) {
    throw new Error('Client not found', { cause: 404 });
  }

  const invoicesCount = await Invoice.count({
    where: { clientId: client.id },
  });

  if (invoicesCount > 0) {
    throw new Error('Client has associated invoices and cannot be deleted.', { cause: 400 });
  }

  await client.destroy();
  return true;
};

export default {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
};
