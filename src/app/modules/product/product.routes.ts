import express from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import { ProductController } from './product.controller';

const router = express.Router();

router.post(
  '/',
  auth(UserRole.ADMIN, UserRole.MANAGER),
  ProductController.createProduct
);

router.get('/', ProductController.getAllProducts);
router.get('/:id', ProductController.getSingleProduct);

router.patch(
  '/:id',
  auth(UserRole.ADMIN, UserRole.MANAGER),
  ProductController.updateProduct
);

router.delete(
  '/:id',
  auth(UserRole.ADMIN, UserRole.MANAGER),
  ProductController.deleteProduct
);

export const ProductRoutes = router;
