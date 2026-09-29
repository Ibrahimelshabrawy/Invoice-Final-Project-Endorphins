import crypto from 'crypto';
import {
  ACCESS_SECRET_KEY,
  EXPIRES_IN,
  ADMIN_PASSWORD,
} from '../../config.service.js';
import { GenerateToken } from '../utils/jwt/token.service.js';

export const login = async ({ password }) => {
  if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
    throw new Error('Invalid credentials', { cause: 400 });
  }

  const jwtid = crypto.randomUUID();

  const access_token = GenerateToken({
    payload: {
      role: 'admin',
    },
    secret_key: ACCESS_SECRET_KEY,
    options: {
      expiresIn: EXPIRES_IN,
      jwtid,
    },
  });

  return {
    access_token,
  };
};

export const logout = async () => {
  return true;
};

export default {
  login,
  logout,
};
