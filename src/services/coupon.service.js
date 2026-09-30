import { Op } from 'sequelize';
import {
  Coupon,
  CouponService,
  CouponUsage,
  Service,
  Bundle,
  Invoice,
  InvoiceItem,
  sequelize,
} from '../models/index.js';
import { CouponScopeEnum } from '../utils/enum/couponScope.enum.js';
import { DiscountTypeEnum } from '../utils/enum/discountType.enum.js';

const couponIncludes = [
  {
    model: Service,
    as: 'services',
    through: { attributes: [] },
    attributes: ['id', 'name', 'unitPrice', 'isActive'],
  },
];

export const createCoupon = async ({
  code,
  discountType,
  discountValue,
  scope,
  maxUses,
  isActive = true,
  serviceIds = [],
}) => {
  const normalizedCode = code.trim().toUpperCase();

  return await sequelize.transaction(async (t) => {
    const existingCoupon = await Coupon.findOne({
      where: { code: normalizedCode },
      transaction: t,
    });

    if (existingCoupon) {
      throw new Error('A coupon with this code already exists', { cause: 409 });
    }

    if (scope === CouponScopeEnum.SERVICE) {
      const activeServices = await Service.findAll({
        where: {
          id: serviceIds,
          isActive: true,
        },
        transaction: t,
      });

      if (activeServices.length !== serviceIds.length) {
        throw new Error(
          'One or more specified services do not exist or are inactive',
          { cause: 400 }
        );
      }
    }

    const coupon = await Coupon.create(
      {
        code: normalizedCode,
        discountType,
        discountValue: Number(discountValue),
        scope,
        maxUses: Number(maxUses),
        isActive,
      },
      { transaction: t }
    );

    if (scope === CouponScopeEnum.SERVICE && serviceIds.length > 0) {
      const couponServicesData = serviceIds.map((serviceId) => ({
        couponId: coupon.id,
        serviceId: Number(serviceId),
      }));

      await CouponService.bulkCreate(couponServicesData, { transaction: t });
    }

    return coupon;
  });
};

export const getAllCoupons = async (query = {}) => {
  const where = {};

  if (query.isActive !== undefined) {
    where.isActive = query.isActive === 'true' || query.isActive === true;
  }

  if (query.scope) {
    where.scope = query.scope;
  }

  if (query.discountType) {
    where.discountType = query.discountType;
  }

  if (query.search && query.search.trim()) {
    where.code = { [Op.like]: `%${query.search.trim().toUpperCase()}%` };
  } else if (query.code && query.code.trim()) {
    where.code = { [Op.like]: `%${query.code.trim().toUpperCase()}%` };
  }

  return await Coupon.findAll({
    where,
    include: couponIncludes,
    order: [['id', 'ASC']],
  });
};

export const getCouponById = async (id) => {
  const coupon = await Coupon.findByPk(Number(id), {
    include: couponIncludes,
  });

  if (!coupon) {
    throw new Error('Coupon not found', { cause: 404 });
  }

  return coupon;
};

export const updateCoupon = async (id, data) => {
  return await sequelize.transaction(async (t) => {
    const coupon = await Coupon.findByPk(Number(id), { transaction: t });

    if (!coupon) {
      throw new Error('Coupon not found', { cause: 404 });
    }

    if (data.code !== undefined) {
      const normalizedCode = data.code.trim().toUpperCase();
      if (normalizedCode !== coupon.code) {
        const existing = await Coupon.findOne({
          where: { code: normalizedCode },
          transaction: t,
        });

        if (existing) {
          throw new Error('A coupon with this code already exists', { cause: 409 });
        }
        coupon.code = normalizedCode;
      }
    }

    if (data.discountType !== undefined) {
      coupon.discountType = data.discountType;
    }

    if (data.discountValue !== undefined) {
      coupon.discountValue = Number(data.discountValue);
    }

    if (data.maxUses !== undefined) {
      coupon.maxUses = Number(data.maxUses);
    }

    if (data.isActive !== undefined) {
      coupon.isActive = data.isActive;
    }

    const targetScope = data.scope !== undefined ? data.scope : coupon.scope;
    coupon.scope = targetScope;

    if (targetScope === CouponScopeEnum.SERVICE) {
      if (data.serviceIds !== undefined) {
        const activeServices = await Service.findAll({
          where: {
            id: data.serviceIds,
            isActive: true,
          },
          transaction: t,
        });

        if (activeServices.length !== data.serviceIds.length) {
          throw new Error(
            'One or more specified services do not exist or are inactive',
            { cause: 400 }
          );
        }

        await CouponService.destroy({
          where: { couponId: coupon.id },
          transaction: t,
        });

        const couponServicesData = data.serviceIds.map((serviceId) => ({
          couponId: coupon.id,
          serviceId: Number(serviceId),
        }));

        await CouponService.bulkCreate(couponServicesData, { transaction: t });
      }
    } else if (data.scope === CouponScopeEnum.INVOICE) {
      await CouponService.destroy({
        where: { couponId: coupon.id },
        transaction: t,
      });
    }

    await coupon.save({ transaction: t });

    return coupon;
  });
};

export const deactivateCoupon = async (id) => {
  const coupon = await Coupon.findByPk(Number(id));

  if (!coupon) {
    throw new Error('Coupon not found', { cause: 404 });
  }

  coupon.isActive = false;
  await coupon.save();

  return coupon;
};

export const activateCoupon = async (id) => {
  const coupon = await Coupon.findByPk(Number(id), {
    include: couponIncludes,
  });

  if (!coupon) {
    throw new Error('Coupon not found', { cause: 404 });
  }

  if (coupon.scope === CouponScopeEnum.SERVICE) {
    const inactiveService = coupon.services?.find((s) => !s.isActive);
    if (inactiveService) {
      throw new Error(
        `Cannot activate coupon: linked service "${inactiveService.name}" is inactive`,
        { cause: 400 }
      );
    }
  }

  coupon.isActive = true;
  await coupon.save();

  return coupon;
};

export const deleteCoupon = async (id) => {
  const coupon = await Coupon.findByPk(Number(id));

  if (!coupon) {
    throw new Error('Coupon not found', { cause: 404 });
  }

  const [invoicesCount, invoiceItemsCount, usagesCount] = await Promise.all([
    Invoice.count({ where: { couponId: coupon.id } }),
    InvoiceItem.count({ where: { couponId: coupon.id } }),
    CouponUsage.count({ where: { couponId: coupon.id } }),
  ]);

  if (invoicesCount > 0 || invoiceItemsCount > 0 || usagesCount > 0) {
    throw new Error(
      'Coupon has associated invoices or usages and cannot be deleted. It must be deactivated instead.',
      { cause: 400 }
    );
  }

  return await sequelize.transaction(async (t) => {
    await CouponService.destroy({
      where: { couponId: coupon.id },
      transaction: t,
    });

    await coupon.destroy({ transaction: t });
    return true;
  });
};

export const applyCoupon = async ({ code, subtotal, items = [] }) => {
  const normalizedCode = code.trim().toUpperCase();

  const coupon = await Coupon.findOne({
    where: { code: normalizedCode },
    include: couponIncludes,
  });

  if (!coupon) {
    throw new Error('Invalid coupon code', { cause: 404 });
  }

  if (!coupon.isActive) {
    throw new Error('This coupon is currently inactive', { cause: 400 });
  }

  if (coupon.usedCount >= coupon.maxUses) {
    throw new Error('This coupon has reached its maximum usage limit', {
      cause: 400,
    });
  }

  const discountValue = Number(coupon.discountValue);

  // If items are provided, retrieve authoritative unit prices directly from the database
  let itemsBreakdown = [];
  let computedItemsSubtotal = 0;

  if (items && items.length > 0) {
    const serviceIds = [];
    const bundleIds = [];

    for (const item of items) {
      const type = item.bundleId ? CouponScopeEnum.BUNDLE : (item.itemType || CouponScopeEnum.SERVICE);
      const id = Number(item.refId || item.serviceId || item.bundleId);
      if (type === CouponScopeEnum.BUNDLE) {
        bundleIds.push(id);
      } else {
        serviceIds.push(id);
      }
    }

    const [services, bundles] = await Promise.all([
      serviceIds.length > 0
        ? Service.findAll({
          where: { id: serviceIds },
          attributes: ['id', 'name', 'unitPrice', 'isActive'],
        })
        : [],
      bundleIds.length > 0
        ? Bundle.findAll({
          where: { id: bundleIds },
          attributes: ['id', 'name', 'price', 'isActive'],
        })
        : [],
    ]);

    const serviceMap = new Map(services.map((s) => [s.id, s]));
    const bundleMap = new Map(bundles.map((b) => [b.id, b]));

    itemsBreakdown = items.map((item) => {
      const type = item.bundleId ? CouponScopeEnum.BUNDLE : (item.itemType || CouponScopeEnum.SERVICE);
      const id = Number(item.refId || item.serviceId || item.bundleId);
      const qty = Number(item.quantity || 1);

      let name = '';
      let unitPrice = 0;
      let isService = false;

      if (type === CouponScopeEnum.BUNDLE) {
        const bundle = bundleMap.get(id);
        if (!bundle) {
          throw new Error(`Bundle with ID ${id} not found`, { cause: 404 });
        }
        if (!bundle.isActive) {
          throw new Error(`Bundle with ID ${id} is inactive`, {
            cause: 400,
          });
        }
        name = bundle.name;
        unitPrice = Number(bundle.price);
        isService = false;

      } else {
        const service = serviceMap.get(id);
        if (!service) {
          throw new Error(`Service with ID ${id} not found`, { cause: 404 });
        }
        if (!service.isActive) {
          throw new Error(`Service with ID ${id} is inactive`, {
            cause: 400,
          });
        }
        name = service.name;
        unitPrice = Number(service.unitPrice);
        isService = true;
      }

      const lineTotal = Number((qty * unitPrice).toFixed(2));
      computedItemsSubtotal += lineTotal;

      return {
        itemType: type,
        refId: id,
        serviceId: isService ? id : null,
        bundleId: !isService ? id : null,
        name,
        quantity: qty,
        unitPrice,
        lineTotal,
        isEligible: false,
        itemDiscount: 0,
        discountedLineTotal: lineTotal,
      };
    });
  }

  if (coupon.scope === CouponScopeEnum.INVOICE) {
    let baseSubtotal = 0;

    if (itemsBreakdown.length > 0) {
      baseSubtotal = Number(computedItemsSubtotal.toFixed(2));
    } else if (subtotal !== undefined) {
      baseSubtotal = Number(Number(subtotal).toFixed(2));
    }

    let discountAmount = 0;
    if (coupon.discountType === DiscountTypeEnum.PERCENTAGE) {
      discountAmount = Number(((baseSubtotal * discountValue) / 100).toFixed(2));
    } else {
      discountAmount = Number(Math.min(baseSubtotal, discountValue).toFixed(2));
    }

    const discountedSubtotal = Number(
      Math.max(0, baseSubtotal - discountAmount).toFixed(2)
    );

    const result = {
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue,
        scope: coupon.scope,
      },
      subtotal: baseSubtotal,
      discountAmount,
      discountedSubtotal,
      isApplicable: true,
    };

    if (itemsBreakdown.length > 0) {
      result.items = itemsBreakdown;
    }

    return result;
  }

  if (coupon.scope === CouponScopeEnum.SERVICE) {
    if (!items || items.length === 0) {
      throw new Error(
        'Items list is required to evaluate a service-scoped coupon',
        { cause: 400 }
      );
    }

    const eligibleServiceIds = new Set(
      (coupon.services || []).map((s) => Number(s.id))
    );

    let eligibleSubtotal = 0;

    for (const item of itemsBreakdown) {
      const isEligible =
        item.serviceId !== null && eligibleServiceIds.has(item.serviceId);
      item.isEligible = isEligible;
      if (isEligible) {
        eligibleSubtotal += item.lineTotal;
      }
    }

    if (eligibleSubtotal === 0) {
      throw new Error(
        'This coupon is not applicable to any of the services in your request',
        { cause: 400 }
      );
    }

    let totalDiscount = 0;

    if (coupon.discountType === DiscountTypeEnum.PERCENTAGE) {
      for (const item of itemsBreakdown) {
        if (item.isEligible) {
          const itemDiscount = Number(
            ((item.lineTotal * discountValue) / 100).toFixed(2)
          );
          item.itemDiscount = itemDiscount;
          item.discountedLineTotal = Number(
            Math.max(0, item.lineTotal - itemDiscount).toFixed(2)
          );
          totalDiscount += itemDiscount;
        }
      }
      totalDiscount = Number(totalDiscount.toFixed(2));
    } else {
      totalDiscount = Number(Math.min(eligibleSubtotal, discountValue).toFixed(2));
      let remainingDiscount = totalDiscount;
      const eligibleItems = itemsBreakdown.filter((it) => it.isEligible);

      eligibleItems.forEach((item, index) => {
        if (index === eligibleItems.length - 1) {
          item.itemDiscount = Number(remainingDiscount.toFixed(2));
        } else {
          const proportion = item.lineTotal / eligibleSubtotal;
          const discountShare = Number(
            Math.min(
              item.lineTotal,
              Number((totalDiscount * proportion).toFixed(2))
            )
          );
          item.itemDiscount = discountShare;
          remainingDiscount = Number(
            (remainingDiscount - discountShare).toFixed(2)
          );
        }
        item.discountedLineTotal = Number(
          Math.max(0, item.lineTotal - item.itemDiscount).toFixed(2)
        );
      });
    }

    const effectiveSubtotal = Number(computedItemsSubtotal.toFixed(2));
    const discountedSubtotal = Number(
      Math.max(0, effectiveSubtotal - totalDiscount).toFixed(2)
    );

    return {
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue,
        scope: coupon.scope,
        applicableServices: (coupon.services || []).map((s) => ({
          id: s.id,
          name: s.name,
        })),
      },
      subtotal: effectiveSubtotal,
      discountAmount: totalDiscount,
      discountedSubtotal,
      isApplicable: true,
      items: itemsBreakdown,
    };
  }
};

export default {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deactivateCoupon,
  activateCoupon,
  deleteCoupon,
  applyCoupon,
};
