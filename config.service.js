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
export const ACCESS_SECRET_KEY = process.env.ACCESS_SECRET_KEY || 'default_access_secret_key_endorphins_2026';
export const EXPIRES_IN = process.env.EXPIRES_IN || '1d';
export const TOKEN_PREFIX = process.env.TOKEN_PREFIX || 'admin';

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

// Company Configuration
export const COMPANY_NAME = process.env.COMPANY_NAME || 'Endorphins Software Solutions';
export const COMPANY_LOGO = process.env.COMPANY_LOGO || 'assets/logo.jpg';
export const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || '123 Business Avenue, Smart Village, Cairo, Egypt';
export const COMPANY_TAX_NUMBER = process.env.COMPANY_TAX_NUMBER || 'EG-987-654-321';
export const COMPANY_EMAIL = process.env.COMPANY_EMAIL || "endorphins@mail.com";
export const COMPANY_PHONE = process.env.COMPANY_PHONE || '+20 2 3535 0000';

// Invoice Configuration
export const CURRENCY = process.env.CURRENCY || 'EGP';
export const INVOICE_NUMBER_FORMAT = process.env.INVOICE_NUMBER_FORMAT || 'INV-{YYYY}-{NUMBER}';

// SMTP Configuration
export const SMTP_HOST = process.env.SMTP_HOST || '';
export const SMTP_PORT = process.env.SMTP_PORT ? +process.env.SMTP_PORT : 587;
export const SMTP_USER = process.env.SMTP_USER || '';
export const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
export const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'Endorphins';

/**
 * Returns SMTP mail service configuration object directly from environment variables
 */
export const getSmtpConfig = () => ({
  host: process.env.SMTP_HOST || '',
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  user: process.env.SMTP_USER || '',
  password: process.env.SMTP_PASSWORD || '',
  fromName: process.env.SMTP_FROM_NAME || 'Endorphins',
});
