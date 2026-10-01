import * as settingService from '../services/setting.service.js';

export const getSettings = async (req, res) => {
  const settings = await settingService.getSettings();

  return res.status(200).json({
    message: 'Settings retrieved successfully',
    data: settings,
  });
};

export const updateSettings = async (req, res) => {
  const settings = await settingService.updateSettings(req.body);

  return res.status(200).json({
    message: 'Settings updated successfully',
    data: settings,
  });
};

export default {
  getSettings,
  updateSettings,
};
