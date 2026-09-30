import { Op } from 'sequelize';
import { Service } from '../models/index.js';


export const validateServiceIds = async (serviceIds, transaction = null) => {
    console.log("Inside: ", serviceIds);


    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
        throw new Error('Bundle must contain at least one service', { cause: 400 });
    }

    const ids = serviceIds.map(Number);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
        throw new Error('Bundle cannot contain duplicate services', { cause: 400 });
    }

    const existingServices = await Service.findAll({
        where: {
            id: { [Op.in]: ids },
        },
        transaction,
    });

    if (existingServices.length !== ids.length) {
        const foundIds = new Set(existingServices.map((s) => s.id));
        const missing = ids.filter((id) => !foundIds.has(id));
        throw new Error(`Service(s) not found with ID(s): ${missing.join(', ')}`, { cause: 404 });
    }

    const inactiveServices = existingServices.filter((s) => !s.isActive);
    if (inactiveServices.length > 0) {
        const inactiveNames = inactiveServices.map((s) => `"${s.name}" (ID: ${s.id})`).join(', ');
        throw new Error(`Cannot add inactive service(s) to bundle: ${inactiveNames}`, { cause: 400 });
    }

    return ids;
};