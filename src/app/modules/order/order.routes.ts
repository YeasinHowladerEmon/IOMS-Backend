import express from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import { OrderController } from './order.controller';

const router = express.Router();

router.post(
  '/',
  auth(UserRole.ADMIN, UserRole.MANAGER),
  OrderController.createOrder
);

router.get(
  '/',
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.DEMO_USER),
  OrderController.getAllOrders
);

router.get('/:id', auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.DEMO_USER), OrderController.getOrderById);

router.patch('/:id/status', auth(UserRole.ADMIN, UserRole.MANAGER), OrderController.updateOrderStatus);

router.patch('/:id/cancel', auth(UserRole.ADMIN, UserRole.MANAGER), OrderController.cancelOrder);

export const OrderRoutes = router;
