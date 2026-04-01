import { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import config from '../../config';
import ApiError from '../errors/ApiError';
import { Prisma } from '@prisma/client';
import {
  handlePrismaInitializationError,
  handlePrismaRustPanicError,
  handlePrismaUnknownRequestError,
  handlePrismaValidationError,
  handlerPrismaKnownRequestError,
} from '../errors/handlePrismaError';
import logger from '../../shared/logger';

const globalErrorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next
) => {
  logger.error('Global Error Handler caught an error:', error);

  let statusCode = 500;
  let message = 'Something went wrong !';
  let errorMessages: { path: string | number; message: string }[] = [];

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const simplifiedError = handlerPrismaKnownRequestError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    const simplifiedError = handlePrismaValidationError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (error instanceof Prisma.PrismaClientInitializationError) {
    const simplifiedError = handlePrismaInitializationError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (error instanceof Prisma.PrismaClientRustPanicError) {
    const simplifiedError = handlePrismaRustPanicError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    const simplifiedError = handlePrismaUnknownRequestError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    errorMessages = error.issues.map((issue) => {
      return {
        path: issue.path[issue.path.length - 1],
        message: issue.message,
      };
    });
  } else if (error instanceof ApiError) {
    statusCode = error?.statusCode;
    message = error.message;
    errorMessages = error?.message
      ? [
        {
          path: '',
          message: error?.message,
        },
      ]
      : [];
  } else if (error instanceof Error) {
    message = error?.message;
    errorMessages = error?.message
      ? [
        {
          path: '',
          message: error?.message,
        },
      ]
      : [];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack: config.env !== 'production' ? error?.stack : undefined,
  });
};

export default globalErrorHandler;
