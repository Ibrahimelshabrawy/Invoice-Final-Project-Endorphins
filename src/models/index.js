import sequelize from '../utils/database.js';

import Category from './Category.js';
import Tax from './Tax.js';
import Service from './Service.js';
import Bundle from './Bundle.js';
import BundleItem from './BundleItem.js';
import Client from './Client.js';
import Coupon from './Coupon.js';
import CouponService from './CouponService.js';
import Invoice from './Invoice.js';
import InvoiceItem from './InvoiceItem.js';
import InvoiceTax from './InvoiceTax.js';
import InvoiceItemTax from './InvoiceItemTax.js';
import CouponUsage from './CouponUsage.js';
import EmailTemplate from './EmailTemplate.js';
import EmailLog from './EmailLog.js';
import Setting from './Setting.js';
import InvoiceNumberCounter from './InvoiceNumberCounter.js';
import Admin from './Admin.js';


// --- Associations ---

// Categories self-reference
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parent_id' });
Category.hasMany(Category, { as: 'subcategories', foreignKey: 'parent_id' });

// Category <-> Service
Category.hasMany(Service, { as: 'services', foreignKey: 'category_id' });
Service.belongsTo(Category, { as: 'category', foreignKey: 'category_id' });

Category.hasMany(Service, { as: 'subcategoryServices', foreignKey: 'subcategory_id' });
Service.belongsTo(Category, { as: 'subcategory', foreignKey: 'subcategory_id' });

// Tax <-> Service
Tax.hasMany(Service, { as: 'services', foreignKey: 'default_tax_id' });
Service.belongsTo(Tax, { as: 'defaultTax', foreignKey: 'default_tax_id' });

// Bundle <-> Service (many-to-many through BundleItem)
Bundle.belongsToMany(Service, {
  through: BundleItem,
  as: 'services',
  foreignKey: 'bundle_id',
  otherKey: 'service_id',
});
Service.belongsToMany(Bundle, {
  through: BundleItem,
  as: 'bundles',
  foreignKey: 'service_id',
  otherKey: 'bundle_id',
});

Bundle.hasMany(BundleItem, { as: 'bundleItems', foreignKey: 'bundle_id' });
BundleItem.belongsTo(Bundle, { as: 'bundle', foreignKey: 'bundle_id' });

Service.hasMany(BundleItem, { as: 'bundleItems', foreignKey: 'service_id' });
BundleItem.belongsTo(Service, { as: 'service', foreignKey: 'service_id' });

// Client <-> Invoice
Client.hasMany(Invoice, { as: 'invoices', foreignKey: 'client_id' });
Invoice.belongsTo(Client, { as: 'client', foreignKey: 'client_id' });

// Coupon <-> Service (many-to-many through CouponService)
Coupon.belongsToMany(Service, {
  through: CouponService,
  as: 'services',
  foreignKey: 'coupon_id',
  otherKey: 'service_id',
});
Service.belongsToMany(Coupon, {
  through: CouponService,
  as: 'coupons',
  foreignKey: 'service_id',
  otherKey: 'coupon_id',
});

Coupon.hasMany(CouponService, { as: 'couponServices', foreignKey: 'coupon_id' });
CouponService.belongsTo(Coupon, { as: 'coupon', foreignKey: 'coupon_id' });

Service.hasMany(CouponService, { as: 'couponServices', foreignKey: 'service_id' });
CouponService.belongsTo(Service, { as: 'service', foreignKey: 'service_id' });

// Coupon <-> Invoice
Coupon.hasMany(Invoice, { as: 'invoices', foreignKey: 'coupon_id' });
Invoice.belongsTo(Coupon, { as: 'coupon', foreignKey: 'coupon_id' });

// Invoice <-> InvoiceItem
Invoice.hasMany(InvoiceItem, { as: 'items', foreignKey: 'invoice_id' });
InvoiceItem.belongsTo(Invoice, { as: 'invoice', foreignKey: 'invoice_id' });

// Coupon <-> InvoiceItem
Coupon.hasMany(InvoiceItem, { as: 'invoiceItems', foreignKey: 'coupon_id' });
InvoiceItem.belongsTo(Coupon, { as: 'coupon', foreignKey: 'coupon_id' });

// Invoice <-> InvoiceTax & Tax <-> InvoiceTax
Invoice.hasMany(InvoiceTax, { as: 'taxes', foreignKey: 'invoice_id' });
InvoiceTax.belongsTo(Invoice, { as: 'invoice', foreignKey: 'invoice_id' });

Tax.hasMany(InvoiceTax, { as: 'invoiceTaxes', foreignKey: 'tax_id' });
InvoiceTax.belongsTo(Tax, { as: 'tax', foreignKey: 'tax_id' });

// InvoiceItem <-> InvoiceItemTax & Tax <-> InvoiceItemTax
InvoiceItem.hasMany(InvoiceItemTax, { as: 'itemTaxes', foreignKey: 'invoice_item_id' });
InvoiceItemTax.belongsTo(InvoiceItem, { as: 'invoiceItem', foreignKey: 'invoice_item_id' });

Tax.hasMany(InvoiceItemTax, { as: 'invoiceItemTaxes', foreignKey: 'tax_id' });
InvoiceItemTax.belongsTo(Tax, { as: 'tax', foreignKey: 'tax_id' });

// Coupon <-> CouponUsage & Invoice <-> CouponUsage
Coupon.hasMany(CouponUsage, { as: 'usages', foreignKey: 'coupon_id' });
CouponUsage.belongsTo(Coupon, { as: 'coupon', foreignKey: 'coupon_id' });

Invoice.hasMany(CouponUsage, { as: 'couponUsages', foreignKey: 'invoice_id' });
CouponUsage.belongsTo(Invoice, { as: 'invoice', foreignKey: 'invoice_id' });

// Invoice <-> EmailLog
Invoice.hasMany(EmailLog, { as: 'emailLogs', foreignKey: 'invoice_id' });
EmailLog.belongsTo(Invoice, { as: 'invoice', foreignKey: 'invoice_id' });

// Admin <-> Invoice
Admin.hasMany(Invoice, { as: 'invoices', foreignKey: 'created_by' });
Invoice.belongsTo(Admin, { as: 'creator', foreignKey: 'created_by' });


export {
  sequelize,
  Category,
  Tax,
  Service,
  Bundle,
  BundleItem,
  Client,
  Coupon,
  CouponService,
  Invoice,
  InvoiceItem,
  InvoiceTax,
  InvoiceItemTax,
  CouponUsage,
  EmailTemplate,
  EmailLog,
  Setting,
  InvoiceNumberCounter,
  Admin,
};

export default {
  sequelize,
  Category,
  Tax,
  Service,
  Bundle,
  BundleItem,
  Client,
  Coupon,
  CouponService,
  Invoice,
  InvoiceItem,
  InvoiceTax,
  InvoiceItemTax,
  CouponUsage,
  EmailTemplate,
  EmailLog,
  Setting,
  InvoiceNumberCounter,
  Admin,
};
