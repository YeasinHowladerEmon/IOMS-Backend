"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestockService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const getRestockQueue = async () => {
    const result = await prisma_1.default.restockQueue.findMany({
        include: {
            product: true,
        },
        orderBy: [
            {
                product: {
                    stockQuantity: 'asc',
                },
            },
            {
                priority: 'asc', // HIGH, MEDIUM, LOW in enum order? Prisma enum order depends on definition order.
            },
        ],
    });
    return result;
};
const restockProduct = async (productId, stockToAdd) => {
    const isProductExist = await prisma_1.default.product.findUnique({
        where: { id: productId },
    });
    if (!isProductExist) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Product not found');
    }
    await prisma_1.default.$transaction(async (tx) => {
        // 1. Update product stock
        const newStock = isProductExist.stockQuantity + stockToAdd;
        await tx.product.update({
            where: { id: productId },
            data: {
                stockQuantity: newStock,
                status: 'ACTIVE',
            },
        });
        await tx.activityLog.create({
            data: {
                message: `Stock updated for "${isProductExist.name}" (+${stockToAdd})`,
            },
        });
        // 2. Remove from Restock Queue if stock is now >= threshold
        if (newStock >= isProductExist.minStockThreshold) {
            await tx.restockQueue.deleteMany({
                where: { productId },
            });
        }
        else {
            // Update priority if it's still below threshold
            let priority = 'LOW';
            if (newStock === 0) {
                priority = 'HIGH';
            }
            else if (newStock < isProductExist.minStockThreshold / 2) {
                priority = 'MEDIUM';
            }
            await tx.restockQueue.update({
                where: { productId },
                data: { priority },
            });
        }
    });
};
const removeFromQueue = async (productId) => {
    const isProductInQueue = await prisma_1.default.restockQueue.findUnique({
        where: { productId },
        include: { product: true },
    });
    await prisma_1.default.restockQueue.deleteMany({
        where: { productId },
    });
    if (isProductInQueue) {
        await prisma_1.default.activityLog.create({
            data: {
                message: `Product "${isProductInQueue.product.name}" removed from Restock Queue`,
            },
        });
    }
};
exports.RestockService = {
    getRestockQueue,
    restockProduct,
    removeFromQueue,
};
