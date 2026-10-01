import {
    Client,
    InvoiceItem,
    InvoiceTax,
    Service,
    Bundle,
    InvoiceNumberCounter,
    Tax,
} from "../models/index.js";
import { ItemTypeEnum } from "../utils/enum/itemType.enum.js";
import { DiscountTypeEnum } from "../utils/enum/discountType.enum.js";
import { INVOICE_NUMBER_FORMAT } from "../../config.service.js";

/**
 * Standard includes for fetching full Invoice records
 */
export const invoiceIncludes = [
    {
        model: Client,
        as: 'client',
        attributes: ['id', 'name', 'company', 'email', 'phone', 'address', 'taxNumber'],
    },
    {
        model: InvoiceItem,
        as: 'items',
    },
    {
        model: InvoiceTax,
        as: 'taxes',
    },
];

/**
 * Formats invoice number according to template
 * @param {string} format Format pattern (e.g., 'INV-{year}-{number}', 'INV-{YYYY}-{00000}')
 * @param {number|string} year Year of the invoice
 * @param {number|string} counterNumber Sequential counter number
 * @returns {string} Formatted invoice number
 */
export const formatInvoiceNumber = (format, year, counterNumber) => {
    const sequentialNumber = String(counterNumber).padStart(5, '0');
    if (!format || typeof format !== 'string' || !format.trim()) {
        return `INV-${year}-${sequentialNumber}`;
    }

    let result = format.trim();

    // Replace year placeholders: {year}, {YEAR}, {YYYY}, ${year}
    result = result.replace(/\$?\{year\}|\$?\{yyyy\}/gi, String(year));
    result = result.replace(/\$?\{yy\}/gi, String(year).slice(-2));

    // Replace zero-padded templates like {00000}, {0000}
    let hasZeros = false;
    result = result.replace(/\{0+\}/g, (match) => {
        hasZeros = true;
        const len = match.length - 2;
        return String(counterNumber).padStart(len, '0');
    });

    // Replace sequential number placeholders: {sequentialNumber}, {number}, {seq}
    if (/\$?\{(sequentialNumber|number|seq)\}/i.test(result)) {
        result = result.replace(/\$?\{(sequentialNumber|number|seq)\}/gi, sequentialNumber);
    } else if (!hasZeros && !result.includes(sequentialNumber)) {
        result = `${result}-${sequentialNumber}`;
    }

    return result;
};

/**
 * Generates a unique, sequential, non-reusable invoice number per year based on INVOICE_NUMBER_FORMAT env.
 * Resets sequentially each year.
 */
export const generateSequentialInvoiceNumber = async (issueDate, transaction) => {
    const year = issueDate ? new Date(issueDate).getFullYear() : new Date().getFullYear();

    let counter = await InvoiceNumberCounter.findOne({
        where: { year },
        ...(transaction ? { lock: transaction.LOCK.UPDATE, transaction } : {}),
    });

    if (!counter) {
        try {
            counter = await InvoiceNumberCounter.create(
                { year, lastNumber: 1 },
                transaction ? { transaction } : undefined
            );
        } catch (err) {
            counter = await InvoiceNumberCounter.findOne({
                where: { year },
                ...(transaction ? { lock: transaction.LOCK.UPDATE, transaction } : {}),
            });
            counter.lastNumber += 1;
            await counter.save(transaction ? { transaction } : {});
        }
    } else {
        counter.lastNumber += 1;
        await counter.save(transaction ? { transaction } : {});
    }

    const format = INVOICE_NUMBER_FORMAT || 'INV-{YYYY}-{NUMBER}';
    return formatInvoiceNumber(format, year, counter.lastNumber);
};

/**
 * Helper to get default date strings
 */
export const getTodayDateString = () => new Date().toISOString().split('T')[0];

export const getDefaultDueDateString = (issueDateStr, days = 14) => {
    const date = issueDateStr ? new Date(issueDateStr) : new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

/**
 * Calculates invoice items, invoice-level discount, and invoice-level taxes.
 * Both Services and Bundles are treated equally.
 */
export const calculateInvoiceItemsAndTaxes = async (
    items,
    { discountValue = 0, discountType = null, taxIds = [] } = {},
    transaction = null
) => {
    if (!items || items.length === 0) {
        throw new Error('Invoice must contain at least one item', { cause: 400 });
    }

    const processedItems = [];

    for (const rawItem of items) {
        const { itemType, refId, quantity } = rawItem;
        const qty = Number(quantity);

        if (isNaN(qty) || qty <= 0) {
            throw new Error('Quantity for item must be greater than 0', { cause: 400 });
        }

        const config = {
            [ItemTypeEnum.SERVICE]: { model: Service, label: 'Service', priceField: 'unitPrice' },
            [ItemTypeEnum.BUNDLE]: { model: Bundle, label: 'Bundle', priceField: 'price' },
        }[itemType];

        if (!config) {
            throw new Error(`Invalid item type: ${itemType}`, { cause: 400 });
        }

        const entity = await config.model.findByPk(refId, { transaction });

        if (!entity) {
            throw new Error(`${config.label} with ID ${refId} not found`, { cause: 404 });
        }
        if (!entity.isActive) {
            throw new Error(`${config.label} "${entity.name}" is inactive and cannot be invoiced`, {
                cause: 400,
            });
        }

        const unitPrice = Number(entity[config.priceField]);
        const description = entity.description || entity.name;

        const lineTotal = Number((qty * unitPrice).toFixed(2));

        processedItems.push({
            itemType,
            refId: Number(refId),
            description,
            quantity: qty,
            unitPrice,
            lineTotal,
        });
    }

    const subtotal = Number(
        processedItems.reduce((acc, item) => acc + item.lineTotal, 0).toFixed(2)
    );

    // 1. Invoice-level Taxes calculation (Applied first on subtotal)
    const invoiceTaxes = [];
    if (taxIds && Array.isArray(taxIds) && taxIds.length > 0) {
        const uniqueTaxIds = [...new Set(taxIds.map((id) => Number(id)))];

        for (const taxId of uniqueTaxIds) {
            const tax = await Tax.findByPk(taxId, { transaction });
            if (!tax) {
                throw new Error(`Tax with ID ${taxId} not found`, { cause: 404 });
            }
            if (!tax.isActive) {
                throw new Error(`Tax "${tax.name}" is inactive and cannot be applied`, { cause: 400 });
            }

            const taxRate = Number(tax.rate);
            const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
            invoiceTaxes.push({
                taxId: tax.id,
                name: tax.name,
                rate: taxRate,
                amount: taxAmount,
            });
        }
    }

    const taxTotal = Number(
        invoiceTaxes.reduce((acc, tax) => acc + tax.amount, 0).toFixed(2)
    );
    const amountWithTax = Number((subtotal + taxTotal).toFixed(2));

    // 2. Invoice Discount calculation (Applied after tax)
    const dVal = Number(discountValue || 0);
    let calculatedDiscount = 0;

    if (dVal > 0) {
        if (discountType === DiscountTypeEnum.PERCENTAGE) {
            if (dVal > 100) {
                throw new Error('Discount percentage cannot be greater than 100', { cause: 400 });
            }
            calculatedDiscount = Number(((amountWithTax * dVal) / 100).toFixed(2));
        } else if (discountType === DiscountTypeEnum.FIXED) {
            calculatedDiscount = Number(Math.min(amountWithTax, dVal).toFixed(2));
        } else {
            throw new Error('discountType is required and must be PERCENTAGE or FIXED when discountValue > 0', {
                cause: 400,
            });
        }
    }

    calculatedDiscount = Number(Math.min(amountWithTax, Math.max(0, calculatedDiscount)).toFixed(2));

    const total = Number(Math.max(0, amountWithTax - calculatedDiscount).toFixed(2));

    return {
        processedItems,
        subtotal,
        taxTotal,
        invoiceTaxes,
        discountAmount: calculatedDiscount,
        discountValue: dVal > 0 ? dVal : 0,
        discountType: dVal > 0 ? discountType : null,
        amountWithTax,
        total,
    };
};