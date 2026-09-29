import * as clientService from '../services/client.service.js';

export const createClient = async (req, res) => {
  const client = await clientService.createClient(req.body);

  return res.status(201).json({
    message: 'Client created successfully',
    data: client,
  });
};

export const getAllClients = async (req, res) => {
  const clients = await clientService.getAllClients(req.query);

  return res.status(200).json({
    message: 'Clients retrieved successfully',
    data: clients,
  });
};

export const getClientById = async (req, res) => {
  const client = await clientService.getClientById(req.params.id);

  return res.status(200).json({
    message: 'Client retrieved successfully',
    data: client,
  });
};

export const updateClient = async (req, res) => {
  const client = await clientService.updateClient(req.params.id, req.body);

  return res.status(200).json({
    message: 'Client updated successfully',
    data: client,
  });
};

export const deleteClient = async (req, res) => {
  await clientService.deleteClient(req.params.id);

  return res.status(200).json({
    message: 'Client deleted successfully',
  });
};

export default {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
};
