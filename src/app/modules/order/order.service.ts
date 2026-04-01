import { Order, OrderStatus, RestockPriority, Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import prisma from '../../../shared/prisma';
import { IOrderRequest } from './order.interface';
import { ActivityLogService } from '../activity-log/activity-log.service';

const createOrder = async (data: IOrderRequest): Promise<Order> => {
  const { userId, customerName, items } = data;

  // 1. Prevent duplicate product entries in the same order
  const productIds = items.map((item) => item.productId);
  const uniqueProductIds = new Set(productIds);
  if (productIds.length !== uniqueProductIds.size) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'This product is already added to the order.'
    );
  }

  // Use a transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    let totalOrderPrice = 0;
    const orderItemsData = [];

    // 2. Check stock, status, and calculate price
    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new ApiError(
          httpStatus.NOT_FOUND,
          `Product not found: ${item.productId}`
        );
      }

      // Prevent ordering inactive products
      if (product.status !== 'ACTIVE') {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'This product is currently unavailable.'
        );
      }

      if (product.stockQuantity < item.quantity) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Only ${product.stockQuantity} items available in stock for product: ${product.name}`
        );
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
        let priority: RestockPriority = 'LOW';
        if (newStock === 0) {
          priority = 'HIGH';
        } else if (newStock < product.minStockThreshold / 2) {
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
      }
    }

    // 4. Create the order
    const order = await tx.order.create({
      data: {
        userId,
        customerName,
        totalPrice: totalOrderPrice,
        status: OrderStatus.PENDING,
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

const getOrderById = async (id: string): Promise<Order | null> => {
  const result = await prisma.order.findUnique({
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

const updateOrderStatus = async (
  id: string,
  status: OrderStatus
): Promise<Order> => {
  const isOrderExist = await prisma.order.findUnique({
    where: { id },
  });

  if (!isOrderExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id },
      data: { status },
      include: {
        orderItems: true,
      },
    });

    await tx.activityLog.create({
      data: {
        message: `Order #${id} marked as ${status}`,
      },
    });

    return updatedOrder;
  });

  return result;
};

const cancelOrder = async (id: string): Promise<Order> => {
  const isOrderExist = await prisma.order.findUnique({
    where: {
      id,
    },
    include: {
      orderItems: true,
    },
  });

  if (!isOrderExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  if (isOrderExist.status === OrderStatus.CANCELLED) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Order is already cancelled');
  }

  // Use a transaction to update status and restore stock
  const result = await prisma.$transaction(async (tx) => {
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
      data: { status: OrderStatus.CANCELLED },
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

const getAllOrders = async (
  filters: any,
  paginationOptions: any
): Promise<any> => {
  const { searchTerm, startDate, endDate, ...filterData } = filters;
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const andConditions = [];

  // Search logic
  if (searchTerm) {
    andConditions.push({
      OR: [
        {
          id: {
            contains: searchTerm,
            mode: 'insensitive' as Prisma.QueryMode,
          },
        },
        {
          customerName: {
            contains: searchTerm,
            mode: 'insensitive' as Prisma.QueryMode,
          },
        },
        {
          user: {
            email: {
              contains: searchTerm,
              mode: 'insensitive' as Prisma.QueryMode,
            },
          },
        },
      ],
    });
  }

  // Date range filtering
  if (startDate || endDate) {
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate as string);
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
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const whereConditions: Prisma.OrderWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.order.findMany({
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

  const total = await prisma.order.count({
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

export const OrderService = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
};
