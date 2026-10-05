import fs from 'node:fs';
import path from 'node:path';
import {
  COMPANY_NAME,
  COMPANY_EMAIL,
  COMPANY_ADDRESS,
  COMPANY_PHONE,
} from '../../config.service.js';
import { formatAddressForLanguage } from '../utils/invoiceTemplate.util.js';

export const SUPPORTED_PLACEHOLDERS = [
  'client_name',
  'invoice_id',
  'total',
  'due_date',
  'company_name',
  'company_email',
  'company_address',
  'company_phone',
  'current_year',
];

const TEMPLATES_DIR = path.resolve(process.cwd(), 'templates');

/**
 * Loads predefined template based on language ('EN' or 'AR').
 * 
 * @param {string} language 'EN' | 'AR'
 * @returns {string} Predefined HTML template
 */
export const getPredefinedTemplate = (language = 'EN') => {
  const isArabic = String(language).toUpperCase() === 'AR';
  const filename = isArabic ? 'invoice-email-template-ar.html' : 'invoice-email-template.html';
  const filePath = path.join(TEMPLATES_DIR, filename);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Email template file not found: ${filename}`);
  }

  return fs.readFileSync(filePath, 'utf8');
};

/**
 * Validates that all placeholders in the provided HTML are supported.
 * Throws an error with cause: 400 if any unsupported placeholder is found.
 * 
 * @param {string} html 
 */
export const validatePlaceholders = (html) => {
  if (typeof html !== 'string') {
    const error = new Error('HTML must be a string');
    error.cause = 400;
    throw error;
  }

  const placeholderRegex = /\{\{([^}]+)\}\}/g;
  const unsupported = [];
  let match;

  while ((match = placeholderRegex.exec(html)) !== null) {
    const rawKey = match[1].trim();
    if (!SUPPORTED_PLACEHOLDERS.includes(rawKey)) {
      unsupported.push(`{{${match[1]}}}`);
    }
  }

  if (unsupported.length > 0) {
    const uniqueUnsupported = [...new Set(unsupported)];
    const error = new Error(
      `Unsupported placeholder(s) detected: ${uniqueUnsupported.join(', ')}. Supported placeholders: ${SUPPORTED_PLACEHOLDERS.map((p) => `{{${p}}}`).join(', ')}.`
    );
    error.cause = 400;
    throw error;
  }
};

/**
 * Formats invoice total with currency (e.g., "5,000 EGP")
 * 
 * @param {number|string} total 
 * @param {string} currency 
 * @returns {string}
 */
export const formatTotal = (total, currency = 'EGP', language = 'EN') => {
  const isArabic = String(language).toUpperCase() === 'AR';
  const totalNum = Number(total || 0);
  const formattedNumber = totalNum.toLocaleString('en-US', {
    minimumFractionDigits: totalNum % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  });
  const rawCurrency = String(currency || 'EGP').toUpperCase();
  const currencyDisplay = isArabic
    ? (rawCurrency === 'EGP' ? 'ج.م' : currency)
    : (currency || 'EGP');
  return `${formattedNumber} ${currencyDisplay}`;
};

/**
 * Applies language and direction (RTL/LTR) attributes to the HTML if not already defined.
 * 
 * @param {string} html 
 * @param {string} language 'EN' | 'AR'
 * @returns {string}
 */
export const applyDirectionAndLanguage = (html, language = 'EN') => {
  const isArabic = String(language).toUpperCase() === 'AR';
  const targetDir = isArabic ? 'rtl' : 'ltr';
  const targetLang = isArabic ? 'ar' : 'en';

  if (!html || typeof html !== 'string') {
    return html;
  }

  // If HTML contains an <html ...> tag
  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/<html([^>]*)>/i, (match, attrs) => {
      let newAttrs = attrs;
      if (!/\bdir\s*=/i.test(attrs)) {
        newAttrs = ` dir="${targetDir}"${newAttrs}`;
      }
      if (!/\blang\s*=/i.test(attrs)) {
        newAttrs = ` lang="${targetLang}"${newAttrs}`;
      }
      return `<html${newAttrs}>`;
    });
  }

  // If there is no <html> tag, check if root elements define dir
  if (!/\bdir\s*=/i.test(html)) {
    return `<div dir="${targetDir}" lang="${targetLang}">\n${html}\n</div>`;
  }

  return html;
};

/**
 * Renders an email template by replacing supported placeholders and applying direction/language.
 * 
 * @param {string} html 
 * @param {Object} invoice 
 * @param {string} language 'EN' | 'AR'
 * @returns {string} Rendered HTML
 */
export const renderEmailTemplate = (html, invoice, language = 'EN') => {
  // 1. Validate placeholders
  validatePlaceholders(html);

  // 2. Prepare replacement values
  const isArabic = String(language || invoice.language || '').toUpperCase() === 'AR';
  const clientName = invoice.client?.name || '';
  const invoiceId = invoice.invoiceNumber || '';
  const total = formatTotal(invoice.total, invoice.currency, isArabic ? 'AR' : 'EN');
  const dueDate = invoice.dueDate || '';
  const companyName = COMPANY_NAME || '';
  const companyEmail = COMPANY_EMAIL || '';
  const companyAddress = formatAddressForLanguage(COMPANY_ADDRESS || '', isArabic);
  const companyPhone = COMPANY_PHONE || '';
  const currentYear = String(new Date().getFullYear());

  // 3. Controlled replacements
  let rendered = html
    .replace(/\{\{\s*client_name\s*\}\}/g, clientName)
    .replace(/\{\{\s*invoice_id\s*\}\}/g, invoiceId)
    .replace(/\{\{\s*total\s*\}\}/g, total)
    .replace(/\{\{\s*due_date\s*\}\}/g, dueDate)
    .replace(/\{\{\s*company_name\s*\}\}/g, companyName)
    .replace(/\{\{\s*company_email\s*\}\}/g, companyEmail)
    .replace(/\{\{\s*company_address\s*\}\}/g, companyAddress)
    .replace(/\{\{\s*company_phone\s*\}\}/g, companyPhone)
    .replace(/\{\{\s*current_year\s*\}\}/g, currentYear);

  // 4. Apply language and direction
  rendered = applyDirectionAndLanguage(rendered, language);

  return rendered;
};

/**
 * Renders the predefined template for the specified language with invoice values.
 * 
 * @param {Object} invoice 
 * @param {string} language 'EN' | 'AR'
 * @returns {string}
 */
export const renderPredefinedEmailTemplate = (invoice, language = 'EN') => {
  const templateHtml = getPredefinedTemplate(language);
  return renderEmailTemplate(templateHtml, invoice, language);
};

export default {
  SUPPORTED_PLACEHOLDERS,
  getPredefinedTemplate,
  validatePlaceholders,
  formatTotal,
  applyDirectionAndLanguage,
  renderEmailTemplate,
  renderPredefinedEmailTemplate,
};
