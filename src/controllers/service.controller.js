import * as serviceService from '../services/service.service.js';

export const createService = async (req, res) => {
  const service = await serviceService.createService(req.body);

  return res.status(201).json({
    message: 'Service created successfully',
    data: service,
  });
};

export const getAllServices = async (req, res) => {
  const services = await serviceService.getAllServices(req.query);

  return res.status(200).json({
    message: 'Services retrieved successfully',
    data: services,
  });
};

export const getServiceById = async (req, res) => {
  const service = await serviceService.getServiceById(req.params.id);

  return res.status(200).json({
    message: 'Service retrieved successfully',
    data: service,
  });
};

export const updateService = async (req, res) => {
  const service = await serviceService.updateService(req.params.id, req.body);

  return res.status(200).json({
    message: 'Service updated successfully',
    data: service,
  });
};

export const deactivateService = async (req, res) => {
  const service = await serviceService.deactivateService(req.params.id);

  return res.status(200).json({
    message: 'Service deactivated successfully',
    data: service,
  });
};

export const activateService = async (req, res) => {
  const service = await serviceService.activateService(req.params.id);

  return res.status(200).json({
    message: 'Service activated successfully',
    data: service,
  });
};

export const deleteService = async (req, res) => {
  await serviceService.deleteService(req.params.id);

  return res.status(200).json({
    message: 'Service deleted successfully',
  });
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
