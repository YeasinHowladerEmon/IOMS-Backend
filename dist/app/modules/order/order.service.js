"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const client_1 = require("@prisma/client");
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const createOrder = async (data) => {
    const { userId, customerName, items } = data;
    // 1. Prevent empty orders
    if (!items || items.length === 0) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Order must contain at least one product.');
    }
    // 2. Prevent duplicate product entries in the same order
    const productIds = items.map((item) => item.productId);
    const uniqueProductIds = new Set(productIds);
    if (productIds.length !== uniqueProductIds.size) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'This product is already added to the order.');
    }
    // Use a transaction to ensure atomicity
    const result = await prisma_1.default.$transaction(async (tx) => {
        let totalOrderPrice = 0;
        const orderItemsData = [];
        // 2. Check stock, status, and calculate price
        for (const item of items) {
            const product = await tx.product.findUnique({
                where: { id: item.productId },
            });
            if (!product) {
                throw new ApiError_1.default(http_status_1.default.NOT_FOUND, `Product not found: ${item.productId}`);
            }
            // Prevent ordering inactive products
            if (product.status !== 'ACTIVE') {
                throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'This product is currently unavailable.');
            }
            if (product.stockQuantity < item.quantity) {
                throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Only ${product.stockQuantity} items available in stock`);
            }
            const itemTotalPrice = product.price * item.quantity;
            totalOrderPrice += itemTotalPrice;
            // Prepare order item data with current product price
            orderItemsData.push({
                productId: item.productId,
                quantity: item.quantity,
                price: product.price,
            });
            // 2. Update product stock
            const newStock = product.stockQuantity - item.quantity;
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stockQuantity: newStock,
                    status: newStock <= 0 ? 'OUT_OF_STOCK' : 'ACTIVE',
                },
            });
            // 3. Add to Restock Queue if stock is low
            if (newStock < product.minStockThreshold) {
                let priority = 'LOW';
                if (newStock === 0) {
                    priority = 'HIGH';
                }
                else if (newStock < product.minStockThreshold / 2) {
                    priority = 'MEDIUM';
                }
                await tx.restockQueue.upsert({
                    where: { productId: item.productId },
                    update: { priority },
                    create: {
                        productId: item.productId,
                        priority,
                    },
                });
                await tx.activityLog.create({
                    data: {
                        message: `Product "${product.name}" added to Restock Queue (${priority} Priority)`,
                    },
                });
            }
        }
        // 4. Create the order
        const order = await tx.order.create({
            data: {
                userId,
                customerName,
                totalPrice: totalOrderPrice,
                status: client_1.OrderStatus.PENDING,
                orderItems: {
                    create: orderItemsData,
                },
            },
            include: {
                orderItems: true,
            },
        });
        // 5. Log activity
        await tx.activityLog.create({
            data: {
                message: `Order #${order.id} created by user ${userId}`,
            },
        });
        return order;
    });
    return result;
};
const getOrderById = async (id) => {
    const result = await prisma_1.default.order.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            orderItems: {
                include: {
                    product: true,
                },
            },
        },
    });
    return result;
};
const updateOrderStatus = async (id, status) => {
    const isOrderExist = await prisma_1.default.order.findUnique({
        where: { id },
    });
    if (!isOrderExist) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Order not found');
    }
    const result = await prisma_1.default.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
            where: { id },
            data: { status },
            include: {
                orderItems: true,
            },
        });
        if (status === client_1.OrderStatus.CANCELLED) {
            for (const item of updatedOrder.orderItems) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stockQuantity: {
                            increment: item.quantity,
                        },
                        status: 'ACTIVE',
                    },
                });
            }
        }
        await tx.activityLog.create({
            data: {
                message: `Order #${id} marked as ${status}`,
            },
        });
        return updatedOrder;
    });
    return result;
};
const cancelOrder = async (id) => {
    const isOrderExist = await prisma_1.default.order.findUnique({
        where: {
            id,
        },
        include: {
            orderItems: true,
        },
    });
    if (!isOrderExist) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Order not found');
    }
    if (isOrderExist.status === client_1.OrderStatus.CANCELLED) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Order is already cancelled');
    }
    // Use a transaction to update status and restore stock
    const result = await prisma_1.default.$transaction(async (tx) => {
        // 1. Restore stock for each item
        for (const item of isOrderExist.orderItems) {
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stockQuantity: {
                        increment: item.quantity,
                    },
                    status: 'ACTIVE',
                },
            });
        }
        // 2. Update order status to CANCELLED
        const cancelledOrder = await tx.order.update({
            where: { id },
            data: { status: client_1.OrderStatus.CANCELLED },
            include: {
                orderItems: true,
            },
        });
        await tx.activityLog.create({
            data: {
                message: `Order #${id} cancelled`,
            },
        });
        return cancelledOrder;
    });
    return result;
};
const getAllOrders = async (filters, paginationOptions) => {
    const { searchTerm, startDate, endDate, ...filterData } = filters;
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper_1.paginationHelpers.calculatePagination(paginationOptions);
    const andConditions = [];
    // Search logic
    if (searchTerm) {
        andConditions.push({
            OR: [
                {
                    id: {
                        contains: searchTerm,
                        mode: 'insensitive',
                    },
                },
                {
                    customerName: {
                        contains: searchTerm,
                        mode: 'insensitive',
                    },
                },
                {
                    user: {
                        email: {
                            contains: searchTerm,
                            mode: 'insensitive',
                        },
                    },
                },
            ],
        });
    }
    // Date range filtering
    if (startDate || endDate) {
        const dateFilter = {};
        if (startDate) {
            dateFilter.gte = new Date(startDate);
        }
        if (endDate) {
            dateFilter.lte = new Date(endDate);
        }
        andConditions.push({
            createdAt: dateFilter,
        });
    }
    // Filter logic
    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map((key) => ({
                [key]: {
                    equals: filterData[key],
                },
            })),
        });
    }
    const whereConditions = andConditions.length > 0 ? { AND: andConditions } : {};
    const result = await prisma_1.default.order.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            orderItems: {
                include: {
                    product: true,
                },
            },
        },
    });
    const total = await prisma_1.default.order.count({
        where: whereConditions,
    });
    return {
        meta: {
            total,
            page,
            limit,
        },
        data: result,
    };
};
exports.OrderService = {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
};
