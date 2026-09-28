import { DataTypes, Model } from 'sequelize';
import sequelize from '../utils/database.js';

class CouponUsage extends Model {}

CouponUsage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    couponId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'coupon_id',
      references: {
        model: 'coupons',
        key: 'id',
      },
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
    usedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'used_at',
    },
  },
  {
    sequelize,
    modelName: 'CouponUsage',
    tableName: 'coupon_usages',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: 'coupon_usages_index_19',
        unique: true,
        fields: ['coupon_id', 'invoice_id'],
      },
      {
        name: 'coupon_usages_index_20',
        fields: ['coupon_id'],
      },
      {
        name: 'coupon_usages_index_21',
        fields: ['invoice_id'],
      },
    ],
  }
);

export default CouponUsage;
