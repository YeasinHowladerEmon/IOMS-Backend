import { ActivityLog } from '@prisma/client';
import prisma from '../../../shared/prisma';

const createLog = async (message: string): Promise<ActivityLog> => {
  const result = await prisma.activityLog.create({
    data: {
      message,
    },
  });
  return result;
};

const getRecentLogs = async (limit: number = 10): Promise<ActivityLog[]> => {
  const result = await prisma.activityLog.findMany({
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
  });
  return result;
};

export const ActivityLogService = {
  createLog,
  getRecentLogs,
};
