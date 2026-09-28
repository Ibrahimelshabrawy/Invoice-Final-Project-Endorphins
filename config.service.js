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
