import { Prisma, Product, ProductStatus } from '@prisma/client';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import prisma from '../../../shared/prisma';

const createProduct = async (data: Product): Promise<Product> => {
  // Handle status based on stock
  if (data.stockQuantity <= 0) {
    data.status = ProductStatus.OUT_OF_STOCK;
  } else {
    data.status = ProductStatus.ACTIVE;
  }

  const result = await prisma.product.create({
    data,
    include: {
      category: true,
    },
  });
  return result;
};

const getAllProducts = async (
  filters: any,
  paginationOptions: any
): Promise<any> => {
  const { searchTerm, ...filterData } = filters;
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

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
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const whereConditions: Prisma.ProductWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.product.findMany({
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

  const total = await prisma.product.count({
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

const getSingleProduct = async (id: string): Promise<Product | null> => {
  const result = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
    },
  });
  return result;
};

const updateProduct = async (
  id: string,
  payload: Partial<Product>
): Promise<Product | null> => {
  // If stockQuantity is being updated, handle status
  if (payload.stockQuantity !== undefined) {
    if (payload.stockQuantity <= 0) {
      payload.status = ProductStatus.OUT_OF_STOCK;
    } else {
      payload.status = ProductStatus.ACTIVE;
    }
  }

  const result = await prisma.product.update({
    where: { id },
    data: payload,
    include: {
      category: true,
    },
  });
  return result;
};

const deleteProduct = async (id: string): Promise<Product | null> => {
  const result = await prisma.product.delete({
    where: { id },
  });
  return result;
};

export const ProductService = {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
};
