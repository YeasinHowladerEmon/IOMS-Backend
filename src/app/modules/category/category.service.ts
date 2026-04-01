import { Category } from '@prisma/client';
import httpStatus from 'http-status';
import prisma from '../../../shared/prisma';
import ApiError from '../../errors/ApiError';

const createCategory = async (data: Category): Promise<Category> => {
  // Check if category already exists
  const isCategoryExist = await prisma.category.findFirst({
    where: { name: data.name },
  });

  if (isCategoryExist) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Category already exists');
  }

  const result = await prisma.category.create({
    data,
  });

  await prisma.activityLog.create({
    data: {
      message: `Category "${result.name}" created`,
    },
  });

  return result;
};

const getAllCategories = async (): Promise<Category[]> => {
  const result = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
  });
  return result;
};

const getSingleCategory = async (id: string): Promise<Category | null> => {
  const result = await prisma.category.findUnique({
    where: { id },
    include: {
      products: true,
    },
  });
  return result;
};

const updateCategory = async (
  id: string,
  payload: Partial<Category>
): Promise<Category | null> => {
  const result = await prisma.category.update({
    where: { id },
    data: payload,
  });

  await prisma.activityLog.create({
    data: {
      message: `Category "${result.name}" updated`,
    },
  });

  return result;
};

const deleteCategory = async (id: string): Promise<Category | null> => {
  const result = await prisma.category.delete({
    where: { id },
  });

  if (result) {
    await prisma.activityLog.create({
      data: {
        message: `Category "${result.name}" removed`,
      },
    });
  }

  return result;
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
};
