import * as taxService from '../services/tax.service.js';

export const createTax = async (req, res) => {
  const tax = await taxService.createTax(req.body);

  return res.status(201).json({
    message: 'Tax created successfully',
    data: tax,
  });
};

export const getAllTaxes = async (req, res) => {
  const taxes = await taxService.getAllTaxes(req.query);

  return res.status(200).json({
    message: 'Taxes retrieved successfully',
    data: taxes,
  });
};

export const getTaxById = async (req, res) => {
  const tax = await taxService.getTaxById(req.params.id);

  return res.status(200).json({
    message: 'Tax retrieved successfully',
    data: tax,
  });
};

export const updateTax = async (req, res) => {
  const tax = await taxService.updateTax(req.params.id, req.body);

  return res.status(200).json({
    message: 'Tax updated successfully',
    data: tax,
  });
};

export const deactivateTax = async (req, res) => {
  const tax = await taxService.deactivateTax(req.params.id);

  return res.status(200).json({
    message: 'Tax deactivated successfully',
    data: tax,
  });
};

export const activateTax = async (req, res) => {
  const tax = await taxService.activateTax(req.params.id);

  return res.status(200).json({
    message: 'Tax activated successfully',
    data: tax,
  });
};

export const deleteTax = async (req, res) => {
  await taxService.deleteTax(req.params.id);

  return res.status(200).json({
    message: 'Tax deleted successfully',
  });
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
