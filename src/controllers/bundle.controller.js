import * as bundleService from '../services/bundle.service.js';

export const createBundle = async (req, res) => {
  const bundle = await bundleService.createBundle(req.body);

  return res.status(201).json({
    message: 'Bundle created successfully',
    data: bundle,
  });
};

export const getAllBundles = async (req, res) => {
  const bundles = await bundleService.getAllBundles(req.query);

  return res.status(200).json({
    message: 'Bundles retrieved successfully',
    data: bundles,
  });
};

export const getBundleById = async (req, res) => {
  const bundle = await bundleService.getBundleById(req.params.id);

  return res.status(200).json({
    message: 'Bundle retrieved successfully',
    data: bundle,
  });
};

export const updateBundle = async (req, res) => {
  const bundle = await bundleService.updateBundle(req.params.id, req.body);

  return res.status(200).json({
    message: 'Bundle updated successfully',
    data: bundle,
  });
};

export const deactivateBundle = async (req, res) => {
  const bundle = await bundleService.deactivateBundle(req.params.id);

  return res.status(200).json({
    message: 'Bundle deactivated successfully',
    data: bundle,
  });
};

export const activateBundle = async (req, res) => {
  const bundle = await bundleService.activateBundle(req.params.id);

  return res.status(200).json({
    message: 'Bundle activated successfully',
    data: bundle,
  });
};

export const deleteBundle = async (req, res) => {
  await bundleService.deleteBundle(req.params.id);

  return res.status(200).json({
    message: 'Bundle deleted successfully',
  });
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
