import { DataTypes, Model } from 'sequelize';
import sequelize from '../utils/database.js';
import { UnitTypeEnum } from '../utils/enum/unitType.enum.js';

class Service extends Model {}

Service.init(
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
    unitPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'unit_price',
    },
    unitType: {
      type: DataTypes.ENUM(...Object.values(UnitTypeEnum)),
      allowNull: false,
      field: 'unit_type',
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'category_id',
      references: {
        model: 'categories',
        key: 'id',
      },
    },
    subcategoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'subcategory_id',
      references: {
        model: 'categories',
        key: 'id',
      },
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
    modelName: 'Service',
    tableName: 'services',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: 'services_index_1',
        fields: ['category_id'],
      },
      {
        name: 'services_index_2',
        fields: ['subcategory_id'],
      },
    ],
  }
);

export default Service;
