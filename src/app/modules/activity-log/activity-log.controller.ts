import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { ActivityLogService } from './activity-log.service';

const getRecentLogs = catchAsync(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const result = await ActivityLogService.getRecentLogs(limit);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Recent activity logs fetched successfully',
    data: result,
  });
});

export const ActivityLogController = {
  getRecentLogs,
};
