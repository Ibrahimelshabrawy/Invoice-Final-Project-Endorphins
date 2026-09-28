import { DataTypes, Model } from 'sequelize';
import sequelize from '../utils/database.js';

class CouponService extends Model {}

CouponService.init(
  {
    couponId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      field: 'coupon_id',
      references: {
        model: 'coupons',
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
  },
  {
    sequelize,
    modelName: 'CouponService',
    tableName: 'coupon_services',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: 'coupon_services_index_6',
        fields: ['service_id'],
      },
    ],
  }
);

export default CouponService;
