import CurrencyEnum from './enum/currency.enum.js';

export const DEFAULT_SETTINGS = Object.freeze({
  COMPANY_NAME: 'Endorphins Software Solutions',
  COMPANY_LOGO: 'assets/logo.jpg',
  COMPANY_ADDRESS: '123 Business Avenue, Smart Village, Cairo, Egypt',
  COMPANY_TAX_NUMBER: 'EG-987-654-355',
  CURRENCY: CurrencyEnum.EGP,
  INVOICE_NUMBER_FORMAT: 'INV-{YYYY}-{NUMBER}',
  SMTP_HOST: '',
  SMTP_PORT: '587',
  SMTP_USER: '',
  SMTP_FROM_NAME: 'Endorphins',
});

export const KEY_MAPPING = Object.freeze({
  companyName: 'COMPANY_NAME',
  companyLogo: 'COMPANY_LOGO',
  companyAddress: 'COMPANY_ADDRESS',
  companyTaxNumber: 'COMPANY_TAX_NUMBER',
  currency: 'CURRENCY',
  invoiceNumberFormat: 'INVOICE_NUMBER_FORMAT',
  smtpHost: 'SMTP_HOST',
  smtpPort: 'SMTP_PORT',
  smtpUser: 'SMTP_USER',
  smtpFromName: 'SMTP_FROM_NAME',
});

export default {
  DEFAULT_SETTINGS,
  KEY_MAPPING,
};
