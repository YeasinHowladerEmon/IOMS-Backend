import { RestockQueue } from '@prisma/client';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiError';
import prisma from '../../../shared/prisma';

const getRestockQueue = async (): Promise<RestockQueue[]> => {
  const result = await prisma.restockQueue.findMany({
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

const restockProduct = async (
  productId: string,
  stockToAdd: number
): Promise<void> => {
  const isProductExist = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!isProductExist) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  await prisma.$transaction(async (tx) => {
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
    } else {
      // Update priority if it's still below threshold
      let priority: any = 'LOW';
      if (newStock === 0) {
        priority = 'HIGH';
      } else if (newStock < isProductExist.minStockThreshold / 2) {
        priority = 'MEDIUM';
      }

      await tx.restockQueue.update({
        where: { productId },
        data: { priority },
      });
    }
  });
};

const removeFromQueue = async (productId: string): Promise<void> => {
  const isProductInQueue = await prisma.restockQueue.findUnique({
    where: { productId },
    include: { product: true },
  });

  await prisma.restockQueue.deleteMany({
    where: { productId },
  });

  if (isProductInQueue) {
    await prisma.activityLog.create({
      data: {
        message: `Product "${isProductInQueue.product.name}" removed from Restock Queue`,
      },
    });
  }
};

export const RestockService = {
  getRestockQueue,
  restockProduct,
  removeFromQueue,
};
