import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import config from '../../config';
import ApiError from '../errors/ApiError';
import { jwtHelpers } from '../../helpers/jwtHelpers';
import { JwtPayload } from 'jsonwebtoken';
import logger from '../../shared/logger';

export interface IAuthRequest extends Request {
  user?: JwtPayload | null;
  cookies: any;
}

const auth =
  (...requiredRoles: string[]) =>
    async (req: IAuthRequest, res: Response, next: NextFunction) => {
      try {
        // Get authorization token
        let token = req.headers.authorization;

        if (!token && req.cookies.accessToken) {
          token = req.cookies.accessToken;
        }

        if (!token) {
          throw new ApiError(httpStatus.UNAUTHORIZED, 'You are not authorized');
        }

        // Verify token
        let verifiedUser = null;
        verifiedUser = jwtHelpers.verifyToken(token, config.jwt.secret as Secret);

        req.user = verifiedUser; // Verified user includes role, email, etc.

        // Demo User Restriction
        if (verifiedUser.role === 'DEMO_USER' && req.method !== 'GET') {
          throw new ApiError(
            httpStatus.FORBIDDEN,
            'Demo users can only view data. Actions are restricted.'
          );
        }

        // Role-based authorization
        if (requiredRoles.length && !requiredRoles.includes(verifiedUser.role)) {
          throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
        }
        next();
      } catch (error) {
        logger.error('Auth Middleware Error:', error);
        next(error);
      }
    };

export default auth;
