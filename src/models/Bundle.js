import { DataTypes, Model } from 'sequelize';
import sequelize from '../utils/database.js';

class Bundle extends Model { }

Bundle.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    serviceIds: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      field: 'service_ids',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
  },
  {
    sequelize,
    modelName: 'Bundle',
    tableName: 'bundles',
    timestamps: false,
    underscored: true,
  }
);

export default Bundle;
