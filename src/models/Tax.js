import { DataTypes, Model } from 'sequelize';
import sequelize from '../utils/database.js';

class Tax extends Model {}

Tax.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
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
    modelName: 'Tax',
    tableName: 'taxes',
    timestamps: false,
    underscored: true,
  }
);

export default Tax;
