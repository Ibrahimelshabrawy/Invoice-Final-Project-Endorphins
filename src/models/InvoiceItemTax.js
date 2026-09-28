import { DataTypes, Model } from 'sequelize';
import sequelize from '../utils/database.js';

class InvoiceItemTax extends Model {}

InvoiceItemTax.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    invoiceItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'invoice_item_id',
      references: {
        model: 'invoice_items',
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
    modelName: 'InvoiceItemTax',
    tableName: 'invoice_item_taxes',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: 'invoice_item_taxes_index_17',
        fields: ['invoice_item_id'],
      },
      {
        name: 'invoice_item_taxes_index_18',
        fields: ['tax_id'],
      },
    ],
  }
);

export default InvoiceItemTax;
