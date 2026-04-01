import express from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import { RestockController } from './restock.controller';

const router = express.Router();

router.get(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  RestockController.getRestockQueue
);

router.patch(
  '/:productId/restock',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  RestockController.restockProduct
);

router.delete(
  '/:productId',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  RestockController.removeFromQueue
);

export const RestockRoutes = router;
