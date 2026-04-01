import express from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import { DashboardController } from './dashboard.controller';

const router = express.Router();

router.get(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  DashboardController.getDashboardData
);

export const DashboardRoutes = router;
