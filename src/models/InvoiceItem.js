import { DataTypes, Model } from 'sequelize';
import sequelize from '../utils/database.js';
import { ItemTypeEnum } from '../utils/enum/itemType.enum.js';

class InvoiceItem extends Model {}

InvoiceItem.init(
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
    itemType: {
      type: DataTypes.ENUM(...Object.values(ItemTypeEnum)),
      allowNull: false,
      field: 'item_type',
    },
    refId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'ref_id',
      comment: 'References services.id or bundles.id based on item_type',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'unit_price',
      comment: 'Price snapshot at invoice creation',
    },
    lineTotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'line_total',
    },
  },
  {
    sequelize,
    modelName: 'InvoiceItem',
    tableName: 'invoice_items',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: 'invoice_items_index_11',
        fields: ['invoice_id'],
      },
      {
        name: 'invoice_items_index_12',
        fields: ['item_type'],
      },
      {
        name: 'invoice_items_index_13',
        fields: ['ref_id'],
      },
    ],
  }
);

export default InvoiceItem;
