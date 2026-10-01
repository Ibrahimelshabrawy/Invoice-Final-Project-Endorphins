import { DataTypes, Model } from 'sequelize';
import sequelize from '../utils/database.js';
import { EmailStatusEnum } from '../utils/enum/emailStatus.enum.js';

class EmailLog extends Model {}

EmailLog.init(
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
    recipient: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'recipient',
    },
    cc: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sent_at',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(EmailStatusEnum)),
      allowNull: false,
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'EmailLog',
    tableName: 'email_logs',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'email_logs_index_22',
        fields: ['invoice_id'],
      },
      {
        name: 'email_logs_index_23',
        fields: ['status'],
      },
    ],
  }
);

export default EmailLog;
