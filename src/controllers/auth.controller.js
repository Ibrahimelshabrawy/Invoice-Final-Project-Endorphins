import * as authService from '../services/auth.service.js';

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);

    return res.status(200).json({
      message: 'Logged in successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    await authService.logout();

    return res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    return res.status(200).json({
      message: 'Admin profile retrieved successfully',
      data: {
        admin: {
          id: req.admin.id,
          email: req.admin.email,
          name: req.admin.name,
          createdAt: req.admin.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  login,
  logout,
  me,
};

