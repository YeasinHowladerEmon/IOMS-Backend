"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePrismaUnknownRequestError = exports.handlePrismaRustPanicError = exports.handlePrismaInitializationError = exports.handlePrismaValidationError = exports.handlerPrismaKnownRequestError = void 0;
const http_status_1 = __importDefault(require("http-status"));
const logger_1 = __importDefault(require("../../shared/logger"));
const handlerPrismaKnownRequestError = (error) => {
    let message = 'Database request error';
    let statusCode = 400;
    let errorMessages = [];
    logger_1.default.debug('Prisma Error Details', { error });
    switch (error.code) {
        case 'P2002':
            // Unique constraint violation
            statusCode = http_status_1.default.BAD_REQUEST;
            message = 'Duplicate key error';
            const target = error.meta?.target || [];
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
            }
            else if (error.message.toLowerCase().includes('category')) {
                modelName = 'Category';
            }
            else if (error.message.toLowerCase().includes('user')) {
                modelName = 'User';
            }
            else if (error.message.toLowerCase().includes('product')) {
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
            statusCode = http_status_1.default.NOT_FOUND;
            const p2025ModelMatch = error.message.match(/An operation failed because it depends on one or more records that were required but not found\. (\w+)\.?/);
            let p2025Model = 'Record';
            if (p2025ModelMatch && p2025ModelMatch[1]) {
                const rawP2025 = p2025ModelMatch[1];
                p2025Model = rawP2025.charAt(0).toUpperCase() + rawP2025.slice(1);
            }
            else if (error.message.toLowerCase().includes('category')) {
                p2025Model = 'Category';
            }
            else if (error.message.toLowerCase().includes('user')) {
                p2025Model = 'User';
            }
            else if (error.message.toLowerCase().includes('product')) {
                p2025Model = 'Product';
            }
            message = `${p2025Model} not found`;
            errorMessages = [
                {
                    path: '',
                    message: error.meta?.cause || `${p2025Model} was not found.`,
                },
            ];
            break;
        case 'P2003':
            // Foreign key constraint violation
            statusCode = http_status_1.default.BAD_REQUEST;
            message = 'Delete failed';
            errorMessages = [
                {
                    path: error.meta?.field_name || '',
                    message: 'Cannot delete this record because it is currently in use.',
                },
            ];
            break;
        case 'P2000':
            // Validation error (e.g., value too long for a column)
            statusCode = http_status_1.default.BAD_REQUEST;
            message = 'Validation error';
            errorMessages = [
                {
                    path: error.meta?.column || '',
                    message: `The provided value is too long for the column ${error.meta?.column}.`,
                },
            ];
            break;
        default:
            // Handle other Prisma errors
            statusCode = http_status_1.default.INTERNAL_SERVER_ERROR;
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
exports.handlerPrismaKnownRequestError = handlerPrismaKnownRequestError;
const handlePrismaValidationError = (error) => {
    return {
        statusCode: 400,
        message: 'Validation Failed: Incorrect input',
        errorMessages: error.message.split('\n').map((msg) => ({
            path: '',
            message: msg.trim(),
        })),
    };
};
exports.handlePrismaValidationError = handlePrismaValidationError;
const handlePrismaInitializationError = (error) => ({
    statusCode: 500,
    message: 'Database connection failed',
    errorMessages: [
        {
            path: '',
            message: error.message,
        },
    ],
});
exports.handlePrismaInitializationError = handlePrismaInitializationError;
const handlePrismaRustPanicError = (error) => ({
    statusCode: 500,
    message: 'Unexpected database error (Rust panic)',
    errorMessages: [
        {
            path: '',
            message: error.message,
        },
    ],
});
exports.handlePrismaRustPanicError = handlePrismaRustPanicError;
const handlePrismaUnknownRequestError = (error) => ({
    statusCode: 500,
    message: 'Unknown database error',
    errorMessages: [{ path: '', message: error.message }],
});
exports.handlePrismaUnknownRequestError = handlePrismaUnknownRequestError;
