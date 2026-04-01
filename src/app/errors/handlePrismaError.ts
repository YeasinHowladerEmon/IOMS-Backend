import { Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import logger from '../../shared/logger';

export type IGenericErrorMessage = {
  path: string | number;
  message: string;
};

export type IGenericErrorResponse = {
  statusCode: number;
  message: string;
  errorMessages: IGenericErrorMessage[];
};

const handlerPrismaKnownRequestError = (
  error: Prisma.PrismaClientKnownRequestError
): IGenericErrorResponse => {
  let message = 'Database request error';
  let statusCode = 400;
  let errorMessages: IGenericErrorMessage[] = [];
  logger.debug('Prisma Error Details', { error });

  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      statusCode = httpStatus.BAD_REQUEST;
      message = 'Duplicate key error';
      errorMessages = [
        {
          path: (error.meta?.target as string) || '',
          message: `A record with this ${error.meta?.target} already exists.`,
        },
      ];
      break;
    case 'P2025':
      // Record not found
      statusCode = httpStatus.NOT_FOUND;
      message = 'Record not found';
      errorMessages = [
        {
          path: '',
          message: (error.meta?.cause as string) || 'The requested record was not found.',
        },
      ];
      break;
    case 'P2003':
      // Foreign key constraint violation
      statusCode = httpStatus.BAD_REQUEST;
      message = 'Foreign key constraint failed';
      errorMessages = [
        {
          path: (error.meta?.field_name as string) || '',
          message: 'The referenced record does not exist.',
        },
      ];
      break;
    case 'P2000':
      // Validation error (e.g., value too long for a column)
      statusCode = httpStatus.BAD_REQUEST;
      message = 'Validation error';
      errorMessages = [
        {
          path: (error.meta?.column as string) || '',
          message: `The provided value is too long for the column ${error.meta?.column}.`,
        },
      ];
      break;
    default:
      // Handle other Prisma errors
      statusCode = httpStatus.INTERNAL_SERVER_ERROR;
      message = 'Prisma error';
      errorMessages = [
        {
          path: '',
          message: error.message,
        },
      ];
  }

  return {
    statusCode,
    message,
    errorMessages,
  };
};

const handlePrismaValidationError = (
  error: Prisma.PrismaClientValidationError
): IGenericErrorResponse => {
  return {
    statusCode: 400,
    message: 'Validation Failed: Incorrect input',
    errorMessages: error.message.split('\n').map((msg) => ({
      path: '',
      message: msg.trim(),
    })),
  };
};

const handlePrismaInitializationError = (
  error: Prisma.PrismaClientInitializationError
): IGenericErrorResponse => ({
  statusCode: 500,
  message: 'Database connection failed',
  errorMessages: [
    {
      path: '',
      message: error.message,
    },
  ],
});

const handlePrismaRustPanicError = (
  error: Prisma.PrismaClientRustPanicError
): IGenericErrorResponse => ({
  statusCode: 500,
  message: 'Unexpected database error (Rust panic)',
  errorMessages: [
    {
      path: '',
      message: error.message,
    },
  ],
});

const handlePrismaUnknownRequestError = (
  error: Prisma.PrismaClientUnknownRequestError
): IGenericErrorResponse => ({
  statusCode: 500,
  message: 'Unknown database error',
  errorMessages: [{ path: '', message: error.message }],
});

export {
  handlerPrismaKnownRequestError,
  handlePrismaValidationError,
  handlePrismaInitializationError,
  handlePrismaRustPanicError,
  handlePrismaUnknownRequestError,
};
