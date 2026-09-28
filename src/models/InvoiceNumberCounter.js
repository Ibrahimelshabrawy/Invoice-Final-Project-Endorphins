import { DataTypes, Model } from 'sequelize';
import sequelize from '../utils/database.js';

class InvoiceNumberCounter extends Model {}

InvoiceNumberCounter.init(
  {
    year: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false,
    },
    lastNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'last_number',
    },
  },
  {
    sequelize,
    modelName: 'InvoiceNumberCounter',
    tableName: 'invoice_number_counters',
    timestamps: false,
    underscored: true,
  }
);

export default InvoiceNumberCounter;
