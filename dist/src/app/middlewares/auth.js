"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../../config"));
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const jwtHelpers_1 = require("../../helpers/jwtHelpers");
const logger_1 = __importDefault(require("../../shared/logger"));
const auth = (...requiredRoles) => async (req, res, next) => {
    try {
        // Get authorization token
        let token = req.headers.authorization;
        if (!token && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }
        if (!token) {
            throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'You are not authorized');
        }
        // Verify token
        let verifiedUser = null;
        verifiedUser = jwtHelpers_1.jwtHelpers.verifyToken(token, config_1.default.jwt.secret);
        req.user = verifiedUser; // Verified user includes role, email, etc.
        // Demo User Restriction
        if (verifiedUser.role === 'DEMO_USER' && req.method !== 'GET') {
            throw new ApiError_1.default(http_status_1.default.FORBIDDEN, 'Demo users can only view data. Actions are restricted.');
        }
        // Role-based authorization
        if (requiredRoles.length && !requiredRoles.includes(verifiedUser.role)) {
            throw new ApiError_1.default(http_status_1.default.FORBIDDEN, 'Forbidden');
        }
        next();
    }
    catch (error) {
        logger_1.default.error('Auth Middleware Error:', error);
        next(error);
    }
};
exports.default = auth;
