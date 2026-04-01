"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const client_1 = require("@prisma/client");
const http_status_1 = __importDefault(require("http-status"));
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const createProduct = async (data) => {
    // Check if product already exists
    const isProductExist = await prisma_1.default.product.findFirst({
        where: { name: data.name },
    });
    if (isProductExist) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Product already exists');
    }
    // Handle status based on stock
    if (data.stockQuantity <= 0) {
        data.status = client_1.ProductStatus.OUT_OF_STOCK;
    }
    else {
        data.status = client_1.ProductStatus.ACTIVE;
    }
    const result = await prisma_1.default.$transaction(async (tx) => {
        const product = await tx.product.create({
            data,
            include: {
                category: true,
            },
        });
        // Handle initial restock queue if created with low stock
        if (product.stockQuantity < product.minStockThreshold) {
            let priority = 'LOW';
            if (product.stockQuantity === 0) {
                priority = 'HIGH';
            }
            else if (product.stockQuantity < product.minStockThreshold / 2) {
                priority = 'MEDIUM';
            }
            await tx.restockQueue.upsert({
                where: { productId: product.id },
                update: { priority },
                create: {
                    productId: product.id,
                    priority,
                },
            });
            await tx.activityLog.create({
                data: {
                    message: `Product "${product.name}" added to Restock Queue (${priority} Priority)`,
                },
            });
        }
        await tx.activityLog.create({
            data: {
                message: `Product "${product.name}" added to catalog`,
            },
        });
        return product;
    });
    return result;
};
const getAllProducts = async (filters, paginationOptions) => {
    const { searchTerm, ...filterData } = filters;
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper_1.paginationHelpers.calculatePagination(paginationOptions);
    const andConditions = [];
    // Search logic
    if (searchTerm) {
        andConditions.push({
            OR: ['name'].map((field) => ({
                [field]: {
                    contains: searchTerm,
                    mode: 'insensitive',
                },
            })),
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
    const result = await prisma_1.default.product.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
            [sortBy]: sortOrder,
        },
        include: {
            category: true,
        },
    });
    const total = await prisma_1.default.product.count({
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
const getSingleProduct = async (id) => {
    const result = await prisma_1.default.product.findUnique({
        where: { id },
        include: {
            category: true,
        },
    });
    return result;
};
const updateProduct = async (id, payload) => {
    // If stockQuantity is being updated, handle status
    if (payload.stockQuantity !== undefined) {
        if (payload.stockQuantity <= 0) {
            payload.status = client_1.ProductStatus.OUT_OF_STOCK;
        }
        else {
            payload.status = client_1.ProductStatus.ACTIVE;
        }
    }
    const result = await prisma_1.default.$transaction(async (tx) => {
        const updatedProduct = await tx.product.update({
            where: { id },
            data: payload,
            include: {
                category: true,
            },
        });
        if (payload.stockQuantity !== undefined) {
            // Manage restock queue based on new stock level
            if (updatedProduct.stockQuantity < updatedProduct.minStockThreshold) {
                let priority = 'LOW';
                if (updatedProduct.stockQuantity === 0) {
                    priority = 'HIGH';
                }
                else if (updatedProduct.stockQuantity < updatedProduct.minStockThreshold / 2) {
                    priority = 'MEDIUM';
                }
                await tx.restockQueue.upsert({
                    where: { productId: updatedProduct.id },
                    update: { priority },
                    create: {
                        productId: updatedProduct.id,
                        priority,
                    },
                });
            }
            else {
                // Remove from queue if stock is now >= threshold
                await tx.restockQueue.deleteMany({
                    where: { productId: updatedProduct.id },
                });
            }
            await tx.activityLog.create({
                data: {
                    message: `Stock updated for "${updatedProduct.name}" (${payload.stockQuantity})`,
                },
            });
        }
        else {
            await tx.activityLog.create({
                data: {
                    message: `Product "${updatedProduct.name}" updated`,
                },
            });
        }
        return updatedProduct;
    });
    return result;
};
const deleteProduct = async (id) => {
    const result = await prisma_1.default.product.delete({
        where: { id },
    });
    if (result) {
        await prisma_1.default.activityLog.create({
            data: {
                message: `Product "${result.name}" removed from catalog`,
            },
        });
    }
    return result;
};
exports.ProductService = {
    createProduct,
    getAllProducts,
    getSingleProduct,
    updateProduct,
    deleteProduct,
};
