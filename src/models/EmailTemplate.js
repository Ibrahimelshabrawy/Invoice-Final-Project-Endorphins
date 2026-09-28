import { DataTypes, Model } from 'sequelize';
import sequelize from '../utils/database.js';
import { LanguageEnum } from '../utils/enum/language.enum.js';

class EmailTemplate extends Model {}

EmailTemplate.init(
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
    subject: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    language: {
      type: DataTypes.ENUM(...Object.values(LanguageEnum)),
      allowNull: false,
      defaultValue: LanguageEnum.EN,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_default',
    },
  },
  {
    sequelize,
    modelName: 'EmailTemplate',
    tableName: 'email_templates',
    timestamps: false,
    underscored: true,
  }
);

export default EmailTemplate;
