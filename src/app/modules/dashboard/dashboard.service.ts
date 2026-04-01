import { OrderStatus } from '@prisma/client';
import prisma from '../../../shared/prisma';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

const getDashboardData = async () => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  // 1. Total Orders Today
  const totalOrdersToday = await prisma.order.count({
    where: {
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });

  // 2. Pending vs Completed Orders
  const pendingOrders = await prisma.order.count({
    where: {
      status: OrderStatus.PENDING,
    },
  });

  const completedOrders = await prisma.order.count({
    where: {
      status: OrderStatus.DELIVERED,
    },
  });

  // 3. Low Stock Items Count & Product Summary Preparation
  const allProducts = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      stockQuantity: true,
      minStockThreshold: true,
    },
  });

  const lowStockItems = allProducts.filter(
    (p) => p.stockQuantity < p.minStockThreshold
  );

  // 4. Revenue Today
  const revenueTodayResult = await prisma.order.aggregate({
    where: {
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
      status: {
        not: OrderStatus.CANCELLED,
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
    const day = subDays(now, i);
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    const dayRevenue = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: {
          not: OrderStatus.CANCELLED,
        },
      },
      _sum: {
        totalPrice: true,
      },
    });

    revenueAnalytics.push({
      date: format(day, 'yyyy-MM-dd'),
      revenue: dayRevenue._sum.totalPrice || 0,
    });
  }

  // 6. Recent Activities (Activity Log)
  const recentActivities = await prisma.activityLog.findMany({
    take: 10,
    orderBy: {
      createdAt: 'desc',
    },
  });

  // 7. Product Summary
  const productSummary = allProducts.map((p) => ({
    name: p.name,
    stockQuantity: p.stockQuantity,
    status: p.stockQuantity < p.minStockThreshold ? 'Low Stock' : 'OK',
  }));

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

export const DashboardService = {
  getDashboardData,
};
