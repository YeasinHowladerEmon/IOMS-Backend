import express from 'express';
import { UserRole } from '@prisma/client';
import auth from '../../middlewares/auth';
import { CategoryController } from './category.controller';

const router = express.Router();

router.post(
  '/',
  auth(UserRole.ADMIN, UserRole.MANAGER),
  CategoryController.createCategory
);

router.get('/', CategoryController.getAllCategories);
router.get('/:id', CategoryController.getSingleCategory);

router.patch(
  '/:id',
  auth(UserRole.ADMIN, UserRole.MANAGER),
  CategoryController.updateCategory
);

router.delete(
  '/:id',
  auth(UserRole.ADMIN, UserRole.MANAGER),
  CategoryController.deleteCategory
);

export const CategoryRoutes = router;
