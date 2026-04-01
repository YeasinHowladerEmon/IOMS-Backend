"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const date_fns_1 = require("date-fns");
const getDashboardData = async () => {
    const now = new Date();
    const todayStart = (0, date_fns_1.startOfDay)(now);
    const todayEnd = (0, date_fns_1.endOfDay)(now);
    // 1. Total Orders Today
    const totalOrdersToday = await prisma_1.default.order.count({
        where: {
            createdAt: {
                gte: todayStart,
                lte: todayEnd,
            },
        },
    });
    // 2. Pending vs Completed Orders
    const pendingOrders = await prisma_1.default.order.count({
        where: {
            status: client_1.OrderStatus.PENDING,
        },
    });
    const completedOrders = await prisma_1.default.order.count({
        where: {
            status: client_1.OrderStatus.DELIVERED,
        },
    });
    // 3. Low Stock Items Count & Product Summary Preparation
    const allProducts = await prisma_1.default.product.findMany({
        select: {
            id: true,
            name: true,
            stockQuantity: true,
            minStockThreshold: true,
        },
    });
    const lowStockItems = allProducts.filter((p) => p.stockQuantity < p.minStockThreshold);
    // 4. Revenue Today
    const revenueTodayResult = await prisma_1.default.order.aggregate({
        where: {
            createdAt: {
                gte: todayStart,
                lte: todayEnd,
            },
            status: {
                not: client_1.OrderStatus.CANCELLED,
            },
        },
        _sum: {
            totalPrice: true,
        },
    });
    const revenueToday = revenueTodayResult._sum.totalPrice || 0;
    // 5. 7-Day Revenue Analytics
    const revenueAnalytics = [];
    for (let i = 6; i >= 0; i--) {
        const day = (0, date_fns_1.subDays)(now, i);
        const dayStart = (0, date_fns_1.startOfDay)(day);
        const dayEnd = (0, date_fns_1.endOfDay)(day);
        const dayRevenue = await prisma_1.default.order.aggregate({
            where: {
                createdAt: {
                    gte: dayStart,
                    lte: dayEnd,
                },
                status: {
                    not: client_1.OrderStatus.CANCELLED,
                },
            },
            _sum: {
                totalPrice: true,
            },
        });
        const dayOrders = await prisma_1.default.order.count({
            where: {
                createdAt: {
                    gte: dayStart,
                    lte: dayEnd,
                },
            },
        });
        revenueAnalytics.push({
            date: (0, date_fns_1.format)(day, 'yyyy-MM-dd'),
            revenue: dayRevenue._sum.totalPrice || 0,
            orderCount: dayOrders,
        });
    }
    // 6. Recent Activities (Activity Log)
    const recentActivities = await prisma_1.default.activityLog.findMany({
        take: 10,
        orderBy: {
            createdAt: 'desc',
        },
    });
    // 7. Product Summary
    const productSummary = allProducts.map((p) => {
        let status = '';
        if (p.stockQuantity <= 5) {
            status = 'Very Low';
        }
        else if (p.stockQuantity <= 10) {
            status = 'Low Stock';
        }
        else if (p.stockQuantity <= 18) {
            status = 'OK';
        }
        else if (p.stockQuantity <= 30) {
            status = 'Very Good';
        }
        else {
            status = 'Excellent';
        }
        return {
            name: p.name,
            stockQuantity: p.stockQuantity,
            status,
        };
    });
    return {
        insights: {
            totalOrdersToday,
            pendingOrders,
            completedOrders,
            lowStockItemsCount: lowStockItems.length,
            revenueToday,
        },
        revenueAnalytics,
        recentActivities,
        productSummary,
    };
};
exports.DashboardService = {
    getDashboardData,
};
