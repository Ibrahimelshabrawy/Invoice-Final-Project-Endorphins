import { Op } from 'sequelize';
import { Service, BundleItem } from '../models/index.js';

export const bundleIncludes = [
    {
        model: BundleItem,
        as: 'bundleItems',
        attributes: ['serviceId', 'quantity'],
        include: [
            {
                model: Service,
                as: 'service',
                attributes: ['id', 'name', 'description', 'unitPrice', 'unitType', 'isActive'],
            },
        ],
    },
];


export const validateBundleServices = async (services, transaction = null) => {
    if (!services || !Array.isArray(services) || services.length === 0) {
        throw new Error('Bundle must contain at least one service', { cause: 400 });
    }

    const serviceIds = services.map((item) => Number(item.serviceId));

    const uniqueServiceIds = new Set(serviceIds);
    if (uniqueServiceIds.size !== serviceIds.length) {
        throw new Error('Bundle cannot contain duplicate services', { cause: 400 });
    }
    for (const item of services) {
        const qty = Number(item.quantity);
        if (isNaN(qty) || qty <= 0) {
            throw new Error(`Quantity for service ID ${item.serviceId} must be greater than zero`, {
                cause: 400,
            });
        }
    }

    const existingServices = await Service.findAll({
        where: {
            id: { [Op.in]: serviceIds },
        },
        transaction,
    });

    if (existingServices.length !== serviceIds.length) {
        const foundIds = new Set(existingServices.map((s) => s.id));
        const missingIds = serviceIds.filter((id) => !foundIds.has(id));
        throw new Error(`Service(s) not found with ID(s): ${missingIds.join(', ')}`, { cause: 404 });
    }

    const inactiveServices = existingServices.filter((s) => !s.isActive);
    if (inactiveServices.length > 0) {
        const inactiveNames = inactiveServices.map((s) => `"${s.name}" (ID: ${s.id})`).join(', ');
        throw new Error(`Cannot add inactive service(s) to bundle: ${inactiveNames}`, { cause: 400 });
    }

    return existingServices;
};