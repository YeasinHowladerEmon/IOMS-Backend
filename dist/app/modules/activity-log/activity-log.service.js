"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLogService = void 0;
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const createLog = async (message) => {
    const result = await prisma_1.default.activityLog.create({
        data: {
            message,
        },
    });
    return result;
};
const getRecentLogs = async (limit = 10) => {
    const result = await prisma_1.default.activityLog.findMany({
        take: limit,
        orderBy: {
            createdAt: 'desc',
        },
    });
    return result;
};
exports.ActivityLogService = {
    createLog,
    getRecentLogs,
};
