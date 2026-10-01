import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateInvoiceHtml } from './invoiceTemplate.util.js';
import { COMPANY_ADDRESS, COMPANY_EMAIL, COMPANY_LOGO, COMPANY_NAME, COMPANY_PHONE, COMPANY_TAX_NUMBER, } from '../../config.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Reads an image file and converts it to a base64 Data URI
 * @param {string} filePath Path to image
 * @returns {string} Data URI or empty string
 */
function getFileDataUri(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return '';
  }
  try {
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
    };
    const mime = mimeMap[ext] || 'image/jpeg';
    const buffer = fs.readFileSync(filePath);
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch (error) {
    return '';
  }
}

/**
 * Fetches company configuration from environment variables or returns defaults
 */
export const getCompanyDetails = async () => {
  const defaultLogoPath = path.join(__dirname, '../assets/logo.jpg');
  const logoPath = COMPANY_LOGO || defaultLogoPath;
  const logoDataUri = getFileDataUri(logoPath) || getFileDataUri(defaultLogoPath);

  return {
    name: COMPANY_NAME || 'Endorphins Software Solutions',
    address: COMPANY_ADDRESS || '123 Business Avenue, Smart Village, Cairo, Egypt',
    phone: COMPANY_PHONE || '+20 2 3535 0000',
    email: COMPANY_EMAIL || 'invoicing@endorphins.io',
    taxNumber: COMPANY_TAX_NUMBER || 'EG-987-654-321',
    logoPath,
    logoDataUri,
  };
};

/**
 * Resolves browser launch options, preferring environment variable or system-installed Chrome/Edge if available
 */
function getBrowserLaunchOptions() {
  const options = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=medium',
    ],
  };

  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ].filter(Boolean);

  for (const candidate of possiblePaths) {
    if (fs.existsSync(candidate)) {
      options.executablePath = candidate;
      break;
    }
  }

  return options;
}

/**
 * Generates a PDF buffer for a given invoice object using Puppeteer
 * @param {Object} invoice Invoice object with client, items, taxes
 * @returns {Promise<Buffer>} PDF buffer
 */
export const generateInvoicePDFBuffer = async (invoice) => {
  const company = await getCompanyDetails();
  const html = generateInvoiceHtml(invoice, company);

  const browser = await puppeteer.launch(getBrowserLaunchOptions());

  try {
    const page = await browser.newPage();

    // Set HTML and wait for network/assets to finish loading
    await page.setContent(html, {
      waitUntil: ['load', 'networkidle0'],
    });

    // Ensure all web fonts are loaded before printing
    await page.evaluateHandle('document.fonts.ready');

    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '14mm',
        bottom: '16mm',
        left: '14mm',
        right: '14mm',
      },
    });

    return Buffer.from(pdfUint8Array);
  } finally {
    await browser.close();
  }
};

export default {
  getCompanyDetails,
  generateInvoicePDFBuffer,
};
