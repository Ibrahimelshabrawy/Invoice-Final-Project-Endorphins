import nodemailer from 'nodemailer';
import { getSmtpConfig, COMPANY_EMAIL } from '../../config.service.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGO_PATH = path.join(__dirname, '../assets/logo.jpg');

let customTransporter = null;

/**
 * For testing purposes: allows setting a custom or mock transporter
 */
export const setCustomTransporter = (transporter) => {
  customTransporter = transporter;
};

/**
 * Creates and configures a Nodemailer transporter using SMTP configuration from environment
 */
export const createTransporter = () => {
  if (customTransporter) {
    return customTransporter;
  }

  const config = getSmtpConfig();

  if (!config.host) {
    throw new Error('SMTP host is not configured in environment variables');
  }

  const transportOptions = {
    host: config.host,
    port: config.port || 587,
    secure: config.port === 465,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000,
    tls: {
      rejectUnauthorized: false,
    },
  };

  if (config.user && config.password) {
    transportOptions.auth = {
      user: config.user,
      pass: config.password,
    };
  }

  return nodemailer.createTransport(transportOptions);
};

/**
 * Sends an email with optional attachments
 * 
 * @param {Object} options
 * @param {string} options.to Primary recipient email
 * @param {Array<string>} [options.cc] Array of CC email addresses
 * @param {string} options.subject Email subject
 * @param {string} options.html Email HTML body
 * @param {Array<Object>} [options.attachments] Attachments array
 * @returns {Promise<Object>} Send result
 */
export const sendEmail = async ({ to, cc, subject, html, attachments = [] }) => {
  const config = getSmtpConfig();
  const transporter = createTransporter();

  const fromAddress = config.user || COMPANY_EMAIL || 'invoicing@endorphins.io';
  const from = config.fromName ? `"${config.fromName}" <${fromAddress}>` : fromAddress;
  const mailOptions = {
    from,
    to,
    subject,
    html,
    attachments: [
      ...attachments,
      {
        filename: 'logo.jpg',
        path: LOGO_PATH,
        cid: 'endorphins-logo',
        contentType: 'image/jpeg',
      },
    ],
  };

  if (cc && Array.isArray(cc) && cc.length > 0) {
    mailOptions.cc = cc.join(', ');
  } else if (typeof cc === 'string' && cc.trim()) {
    mailOptions.cc = cc.trim();
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    if (info?.messageId) {
      console.log('Message sent:', info.messageId);
    }
    return info;
  } catch (error) {
    // Sanitize any potential sensitive information (like passwords) from error messages
    let sanitizedMessage = error.message || 'SMTP send failure';
    if (config.password && sanitizedMessage.includes(config.password)) {
      sanitizedMessage = sanitizedMessage.replaceAll(config.password, '******');
    }
    const cleanError = new Error(sanitizedMessage);
    cleanError.code = error.code;
    throw cleanError;
  }
};

export default {
  createTransporter,
  sendEmail,
};
