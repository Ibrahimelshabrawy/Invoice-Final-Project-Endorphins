import { DataTypes, Model } from 'sequelize';
import sequelize from '../utils/database.js';

class InvoiceTax extends Model {}

InvoiceTax.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    invoiceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'invoice_id',
      references: {
        model: 'invoices',
        key: 'id',
      },
    },
    taxId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'tax_id',
      references: {
        model: 'taxes',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Tax name snapshot',
    },
    rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      comment: 'Tax rate snapshot',
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'InvoiceTax',
    tableName: 'invoice_taxes',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: 'invoice_taxes_index_15',
        fields: ['invoice_id'],
      },
      {
        name: 'invoice_taxes_index_16',
        fields: ['tax_id'],
      },
    ],
  }
);

export default InvoiceTax;
