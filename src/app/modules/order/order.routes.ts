import express from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import { OrderController } from './order.controller';

const router = express.Router();

router.post(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.USER),
  OrderController.createOrder
);

router.get(
  '/',
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER),
  OrderController.getAllOrders
);

router.get('/:id', auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.USER), OrderController.getOrderById);

router.patch('/:id/status', auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER), OrderController.updateOrderStatus);

router.patch('/:id/cancel', auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.USER), OrderController.cancelOrder);

export const OrderRoutes = router;
