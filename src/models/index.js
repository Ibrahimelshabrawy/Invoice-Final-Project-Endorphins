import sequelize from '../utils/database.js';

import Category from './Category.js';
import Tax from './Tax.js';
import Service from './Service.js';
import Bundle from './Bundle.js';
import Client from './Client.js';
import Invoice from './Invoice.js';
import InvoiceItem from './InvoiceItem.js';
import InvoiceTax from './InvoiceTax.js';
import EmailTemplate from './EmailTemplate.js';
import EmailLog from './EmailLog.js';
import InvoiceNumberCounter from './InvoiceNumberCounter.js';

// --- Associations ---

// Categories self-reference
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parent_id' });
Category.hasMany(Category, { as: 'subcategories', foreignKey: 'parent_id' });

// Category <-> Service
Category.hasMany(Service, { as: 'services', foreignKey: 'category_id' });
Service.belongsTo(Category, { as: 'category', foreignKey: 'category_id' });

Category.hasMany(Service, { as: 'subcategoryServices', foreignKey: 'subcategory_id' });
Service.belongsTo(Category, { as: 'subcategory', foreignKey: 'subcategory_id' });

// Client <-> Invoice
Client.hasMany(Invoice, { as: 'invoices', foreignKey: 'client_id' });
Invoice.belongsTo(Client, { as: 'client', foreignKey: 'client_id' });

// Invoice <-> InvoiceItem
Invoice.hasMany(InvoiceItem, { as: 'items', foreignKey: 'invoice_id' });
InvoiceItem.belongsTo(Invoice, { as: 'invoice', foreignKey: 'invoice_id' });

// Invoice <-> InvoiceTax & Tax <-> InvoiceTax
Invoice.hasMany(InvoiceTax, { as: 'taxes', foreignKey: 'invoice_id' });
InvoiceTax.belongsTo(Invoice, { as: 'invoice', foreignKey: 'invoice_id' });

Tax.hasMany(InvoiceTax, { as: 'invoiceTaxes', foreignKey: 'tax_id' });
InvoiceTax.belongsTo(Tax, { as: 'tax', foreignKey: 'tax_id' });

// Invoice <-> EmailLog
Invoice.hasMany(EmailLog, { as: 'emailLogs', foreignKey: 'invoice_id' });
EmailLog.belongsTo(Invoice, { as: 'invoice', foreignKey: 'invoice_id' });

export {
  sequelize,
  Category,
  Tax,
  Service,
  Bundle,
  Client,
  Invoice,
  InvoiceItem,
  InvoiceTax,
  EmailTemplate,
  EmailLog,
  InvoiceNumberCounter,
};

export default {
  sequelize,
  Category,
  Tax,
  Service,
  Bundle,
  Client,
  Invoice,
  InvoiceItem,
  InvoiceTax,
  EmailTemplate,
  EmailLog,
  InvoiceNumberCounter,
};
