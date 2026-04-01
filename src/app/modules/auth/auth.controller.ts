import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AuthService } from './auth.service';
import config from '../../../config';
import { IAuthRequest } from '../../middlewares/auth';

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.loginUser(req.body);
  const { accessToken } = result;

  // set cookie
  const cookieOptions = {
    secure: config.env === 'production',
    httpOnly: true,
    sameSite: (config.env === 'production' ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  };

  res.cookie('accessToken', accessToken, cookieOptions);

  res.status(httpStatus.OK).json({
    success: true,
    user: result.user,
    token: accessToken,
  });
});

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerUser(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;

  if (!user || !user.userEmail) {
    return sendResponse(res, {
      statusCode: httpStatus.UNAUTHORIZED,
      success: false,
      message: 'User details not found',
      data: null,
    });
  }

  const result = await AuthService.getMe(user.userEmail);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User profile fetched successfully',
    data: result || null,
  });
});

export const AuthController = {
  loginUser,
  registerUser,
  getMe,
};
