import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '.env') });

export const PORT = process.env.PORT ? +process.env.PORT : 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';

export const CORS_WHITELIST = (process.env.CORS_WHITELIST || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const DB_HOST = process.env.DB_HOST;
export const DB_PORT = process.env.DB_PORT ? +process.env.DB_PORT : undefined;
export const DB_NAME = process.env.DB_NAME;
export const DB_USER = process.env.DB_USER;
export const DB_PASSWORD = process.env.DB_PASSWORD;

export const SALT_ROUND = process.env.SALT_ROUNDS ? +process.env.SALT_ROUNDS : (process.env.SALT_ROUND ? +process.env.SALT_ROUND : 10);
export const ENCRYPT_SECRET_KEY = process.env.ENCRYPT_SECRET_KEY || '12345678901234567890123456789012';
export const ACCESS_SECRET_KEY = process.env.ACCESS_SECRET_KEY || 'default_access_secret_key_endorphins_2026';
export const EXPIRES_IN = process.env.EXPIRES_IN || '1d';
export const TOKEN_PREFIX = process.env.TOKEN_PREFIX || 'admin';

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

