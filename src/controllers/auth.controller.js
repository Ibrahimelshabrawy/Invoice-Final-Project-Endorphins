import * as authService from '../services/auth.service.js';

export const login = async (req, res) => {
  const result = await authService.login(req.body);

  return res.status(200).json({
    message: 'Logged in successfully',
    data: result,
  });
};

export const logout = async (req, res) => {
  await authService.logout();

  return res.status(200).json({
    message: 'Logged out successfully',
  });
};

export const me = async (req, res) => {
  return res.status(200).json({
    message: 'Admin profile retrieved successfully',
    data: {
      admin: req.admin,
    },
  });
};

export default {
  login,
  logout,
  me,
};
