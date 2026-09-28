import { DataTypes, Model } from 'sequelize';
import sequelize from '../utils/database.js';
import { InvoiceStatusEnum } from '../utils/enum/invoiceStatus.enum.js';
import { CurrencyEnum } from '../utils/enum/currency.enum.js';
import { LanguageEnum } from '../utils/enum/language.enum.js';

class Invoice extends Model {}

Invoice.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    invoiceNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'invoice_number',
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'client_id',
      references: {
        model: 'clients',
        key: 'id',
      },
    },
    issueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'issue_date',
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'due_date',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(InvoiceStatusEnum)),
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    couponId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'coupon_id',
      references: {
        model: 'coupons',
        key: 'id',
      },
    },
    discount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    taxTotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'tax_total',
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.ENUM(...Object.values(CurrencyEnum)),
      allowNull: false,
      defaultValue: CurrencyEnum.EGP,
    },
    language: {
      type: DataTypes.ENUM(...Object.values(LanguageEnum)),
      allowNull: false,
      defaultValue: LanguageEnum.EN,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    paymentTerms: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'payment_terms',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by',
    },
  },
  {
    sequelize,
    modelName: 'Invoice',
    tableName: 'invoices',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: 'invoices_index_7',
        fields: ['client_id'],
      },
      {
        name: 'invoices_index_8',
        fields: ['status'],
      },
      {
        name: 'invoices_index_9',
        fields: ['issue_date'],
      },
      {
        name: 'invoices_index_10',
        fields: ['coupon_id'],
      },
    ],
  }
);

export default Invoice;
