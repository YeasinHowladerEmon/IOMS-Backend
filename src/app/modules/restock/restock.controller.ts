import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { RestockService } from './restock.service';

const getRestockQueue = catchAsync(async (req: Request, res: Response) => {
  const result = await RestockService.getRestockQueue();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Restock queue fetched successfully',
    data: result,
  });
});

const restockProduct = catchAsync(async (req: Request, res: Response) => {
  const productId = req.params.productId as string;
  const { stockToAdd } = req.body;
  await RestockService.restockProduct(productId, stockToAdd);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product restocked successfully',
  });
});

const removeFromQueue = catchAsync(async (req: Request, res: Response) => {
  const productId = req.params.productId as string;
  await RestockService.removeFromQueue(productId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Product removed from restock queue',
  });
});

export const RestockController = {
  getRestockQueue,
  restockProduct,
  removeFromQueue,
};
