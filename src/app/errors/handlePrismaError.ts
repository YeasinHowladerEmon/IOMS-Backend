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

      const target = (error.meta?.target as string[]) || [];

      // Extract model name from message or constraint
      // Prisma error messages for P2002 often look like:
      // "Unique constraint failed on the constraint: users_email_key"
      const messageMatch = error.message.match(/constraint: `?(\w+)_(\w+)_key`?/);
      let modelName = 'Record';

      if (messageMatch && messageMatch[1]) {
        // e.g., "users" -> "User"
        const rawModel = messageMatch[1];
        // Remove plural 's' if exists (simple heuristic)
        const singularModel = rawModel.endsWith('s') ? rawModel.slice(0, -1) : rawModel;
        modelName = singularModel.charAt(0).toUpperCase() + singularModel.slice(1);
      } else if (error.message.toLowerCase().includes('category')) {
        modelName = 'Category';
      } else if (error.message.toLowerCase().includes('user')) {
        modelName = 'User';
      } else if (error.message.toLowerCase().includes('product')) {
        modelName = 'Product';
      }

      errorMessages = [
        {
          path: target.join(', ') || '',
          message: `${modelName} already exists`,
        },
      ];
      break;
    case 'P2025':
      // Record not found
      statusCode = httpStatus.NOT_FOUND;
      
      const p2025ModelMatch = error.message.match(/An operation failed because it depends on one or more records that were required but not found\. (\w+)\.?/);
      let p2025Model = 'Record';
      if (p2025ModelMatch && p2025ModelMatch[1]) {
        const rawP2025 = p2025ModelMatch[1];
        p2025Model = rawP2025.charAt(0).toUpperCase() + rawP2025.slice(1);
      } else if (error.message.toLowerCase().includes('category')) {
        p2025Model = 'Category';
      } else if (error.message.toLowerCase().includes('user')) {
        p2025Model = 'User';
      } else if (error.message.toLowerCase().includes('product')) {
        p2025Model = 'Product';
      }

      message = `${p2025Model} not found`;
      errorMessages = [
        {
          path: '',
          message: (error.meta?.cause as string) || `${p2025Model} was not found.`,
        },
      ];
      break;
    case 'P2003':
      // Foreign key constraint violation
      statusCode = httpStatus.BAD_REQUEST;
      message = 'Delete failed';
      errorMessages = [
        {
          path: (error.meta?.field_name as string) || '',
          message: 'Cannot delete this record because it is currently in use.',
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
