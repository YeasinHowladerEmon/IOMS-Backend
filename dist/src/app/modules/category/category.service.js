"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const createCategory = async (data) => {
    // Check if category already exists
    const isCategoryExist = await prisma_1.default.category.findFirst({
        where: { name: data.name },
    });
    if (isCategoryExist) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Category already exists');
    }
    const result = await prisma_1.default.category.create({
        data,
    });
    await prisma_1.default.activityLog.create({
        data: {
            message: `Category "${result.name}" created`,
        },
    });
    return result;
};
const getAllCategories = async () => {
    const result = await prisma_1.default.category.findMany({
        include: {
            _count: {
                select: { products: true },
            },
        },
    });
    return result;
};
const getSingleCategory = async (id) => {
    const result = await prisma_1.default.category.findUnique({
        where: { id },
        include: {
            products: true,
        },
    });
    return result;
};
const updateCategory = async (id, payload) => {
    const result = await prisma_1.default.category.update({
        where: { id },
        data: payload,
    });
    await prisma_1.default.activityLog.create({
        data: {
            message: `Category "${result.name}" updated`,
        },
    });
    return result;
};
const deleteCategory = async (id) => {
    const result = await prisma_1.default.category.delete({
        where: { id },
    });
    if (result) {
        await prisma_1.default.activityLog.create({
            data: {
                message: `Category "${result.name}" removed`,
            },
        });
    }
    return result;
};
exports.CategoryService = {
    createCategory,
    getAllCategories,
    getSingleCategory,
    updateCategory,
    deleteCategory,
};
