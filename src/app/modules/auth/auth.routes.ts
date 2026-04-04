import express from 'express';
import { AuthController } from './auth.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';

const router = express.Router();

router.post('/login', AuthController.loginUser);
router.post('/register', AuthController.registerUser);
router.post('/logout', AuthController.logoutUser);
router.get(
  '/me',
  auth(UserRole.ADMIN, UserRole.MANAGER, UserRole.DEMO_USER),
  AuthController.getMe
);

export const AuthRoutes = router;
