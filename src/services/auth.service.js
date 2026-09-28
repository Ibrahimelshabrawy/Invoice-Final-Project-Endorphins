import crypto from 'crypto';
import {
  ACCESS_SECRET_KEY,
  EXPIRES_IN,
  TOKEN_PREFIX,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
} from '../../config.service.js';
import Admin from '../models/Admin.js';
import { compare_match } from '../utils/security/hash.security.js';
import { GenerateToken } from '../utils/jwt/token.service.js';


export const login = async ({ email, password }) => {

  // Find admin account
  const admin = await Admin.findOne({
    where: { email },
  });

  if (!admin) {
    throw new Error('Invalid credentials', { cause: 400 });
  }

  // Verify entered password against the hashed password stored in database
  const isMatch = await compare_match({
    plainText: password,
    cipherText: admin.password,
  });

  if (!isMatch) {
    throw new Error('Invalid credentials', { cause: 400 });
  }

  const jwtid = crypto.randomUUID();

  const access_token = GenerateToken({
    payload: {
      id: admin.id,
      email: admin.email,
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
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    },
  };
};

export const logout = async () => {
  return true;
};


export default {
  login,
  logout,
};
