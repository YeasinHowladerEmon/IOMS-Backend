import express from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import { ActivityLogController } from './activity-log.controller';

const router = express.Router();

router.get(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  ActivityLogController.getRecentLogs
);

export const ActivityLogRoutes = router;
