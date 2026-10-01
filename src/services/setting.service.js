import { Setting } from '../models/index.js';
import CurrencyEnum from '../utils/enum/currency.enum.js';
import { encrypt, decrypt } from '../utils/security/encryption.security.js';
import { DEFAULT_SETTINGS, KEY_MAPPING } from '../utils/setting.util.js';

/**
 * Initializes default settings if not already present in DB
 */
export const initializeDefaultSettings = async () => {
  const existingSettings = await Setting.findAll({
    attributes: ['key'],
  });

  const existingKeys = new Set(
    existingSettings.map((setting) => setting.key)
  );

  const missingSettings = Object.entries(DEFAULT_SETTINGS)
    .filter(([key, value]) => value && !existingKeys.has(key))
    .map(([key, value]) => ({
      key,
      value,
    }));

  if (missingSettings.length > 0) {
    await Setting.bulkCreate(missingSettings);
  }
};
/**
 * Retrieves all application settings without exposing sensitive credentials like SMTP_PASSWORD
 */
export const getSettings = async () => {
  const records = await Setting.findAll();
  const map = {};

  for (const record of records) {
    if (record.value !== null && record.value !== undefined) {
      map[record.key] = record.value;
    }
  }

  return {
    companyName: map.COMPANY_NAME ?? DEFAULT_SETTINGS.COMPANY_NAME,
    companyLogo: map.COMPANY_LOGO ?? DEFAULT_SETTINGS.COMPANY_LOGO,
    companyAddress: map.COMPANY_ADDRESS ?? DEFAULT_SETTINGS.COMPANY_ADDRESS,
    companyTaxNumber: map.COMPANY_TAX_NUMBER ?? DEFAULT_SETTINGS.COMPANY_TAX_NUMBER,
    currency: CurrencyEnum.EGP,
    invoiceNumberFormat: map.INVOICE_NUMBER_FORMAT ?? DEFAULT_SETTINGS.INVOICE_NUMBER_FORMAT,
    smtpHost: map.SMTP_HOST ?? DEFAULT_SETTINGS.SMTP_HOST,
    smtpPort: map.SMTP_PORT ? Number(map.SMTP_PORT) : Number(DEFAULT_SETTINGS.SMTP_PORT),
    smtpUser: map.SMTP_USER ?? DEFAULT_SETTINGS.SMTP_USER,
    smtpFromName: map.SMTP_FROM_NAME ?? DEFAULT_SETTINGS.SMTP_FROM_NAME,
  };
};

/**
 * Retrieves SMTP connection configuration with decrypted password for internal mail services
 */
export const getSmtpConfig = async () => {
  const records = await Setting.findAll({
    where: {
      key: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM_NAME'],
    },
  });

  const map = {};
  for (const r of records) {
    map[r.key] = r.value;
  }

  let password = null;
  if (map.SMTP_PASSWORD) {
    try {
      password = await decrypt(map.SMTP_PASSWORD);
    } catch {
      password = null;
    }
  }

  return {
    host: map.SMTP_HOST || '',
    port: map.SMTP_PORT ? Number(map.SMTP_PORT) : 587,
    user: map.SMTP_USER || '',
    password,
    fromName: map.SMTP_FROM_NAME || 'Endorphins',
  };
};

/**
 * Updates application settings.
 * Sensitive fields like SMTP_PASSWORD are encrypted before persistence.
 * @param {Object} data Key-value pairs to update
 */
export const updateSettings = async (data) => {
  if (data.currency && data.currency !== CurrencyEnum.EGP) {
    throw new Error('Currency must be EGP (single currency only)', { cause: 400 });
  }

  // Update standard settings
  for (const [prop, internalKey] of Object.entries(KEY_MAPPING)) {
    if (data[prop] !== undefined) {
      const val = data[prop] !== null ? String(data[prop]) : '';
      const existing = await Setting.findOne({ where: { key: internalKey } });
      if (existing) {
        existing.value = val;
        await existing.save();
      } else {
        await Setting.create({ key: internalKey, value: val });
      }
    }
  }

  // Update SMTP Password if provided and non-empty
  if (typeof data.smtpPassword === 'string' && data.smtpPassword.trim().length > 0) {
    const encryptedPassword = await encrypt(data.smtpPassword.trim());
    const existing = await Setting.findOne({ where: { key: 'SMTP_PASSWORD' } });
    if (existing) {
      existing.value = encryptedPassword;
      await existing.save();
    } else {
      await Setting.create({ key: 'SMTP_PASSWORD', value: encryptedPassword });
    }
  }

  return await getSettings();
};

export default {
  initializeDefaultSettings,
  getSettings,
  getSmtpConfig,
  updateSettings,
};
