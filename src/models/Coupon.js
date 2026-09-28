import { DataTypes, Model } from 'sequelize';
import sequelize from '../utils/database.js';
import { DiscountTypeEnum } from '../utils/enum/discountType.enum.js';
import { CouponScopeEnum } from '../utils/enum/couponScope.enum.js';

class Coupon extends Model {}

Coupon.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    discountType: {
      type: DataTypes.ENUM(...Object.values(DiscountTypeEnum)),
      allowNull: false,
      field: 'discount_type',
    },
    discountValue: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: 'discount_value',
    },
    scope: {
      type: DataTypes.ENUM(...Object.values(CouponScopeEnum)),
      allowNull: false,
    },
    maxUses: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'max_uses',
    },
    usedCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'used_count',
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
    modelName: 'Coupon',
    tableName: 'coupons',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: 'coupons_index_4',
        fields: ['code'],
      },
      {
        name: 'coupons_index_5',
        fields: ['is_active'],
      },
    ],
  }
);

export default Coupon;
