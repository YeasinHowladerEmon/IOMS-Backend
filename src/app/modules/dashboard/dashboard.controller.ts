import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { DashboardService } from './dashboard.service';

const getDashboardData = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getDashboardData();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Dashboard data fetched successfully',
    data: result,
  });
});

export const DashboardController = {
  getDashboardData,
};
