import { DataTypes, Model } from 'sequelize';
import sequelize from '../utils/database.js';

class BundleItem extends Model {}

BundleItem.init(
  {
    bundleId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      field: 'bundle_id',
      references: {
        model: 'bundles',
        key: 'id',
      },
    },
    serviceId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      field: 'service_id',
      references: {
        model: 'services',
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'BundleItem',
    tableName: 'bundle_items',
    timestamps: false,
    underscored: true,
  }
);

export default BundleItem;
