"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const auth_service_1 = require("./auth.service");
const config_1 = __importDefault(require("../../../config"));
const loginUser = (0, catchAsync_1.default)(async (req, res) => {
    const result = await auth_service_1.AuthService.loginUser(req.body);
    const { accessToken } = result;
    // set cookie
    const cookieOptions = {
        secure: config_1.default.env === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
    };
    res.cookie('accessToken', accessToken, cookieOptions);
    res.status(http_status_1.default.OK).json({
        success: true,
        user: result.user,
        token: accessToken,
    });
});
const registerUser = (0, catchAsync_1.default)(async (req, res) => {
    const result = await auth_service_1.AuthService.registerUser(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'User registered successfully',
        data: result,
    });
});
const getMe = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    if (!user || !user.userEmail) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.UNAUTHORIZED,
            success: false,
            message: 'User details not found',
            data: null,
        });
    }
    const result = await auth_service_1.AuthService.getMe(user.userEmail);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'User profile fetched successfully',
        data: result || null,
    });
});
exports.AuthController = {
    loginUser,
    registerUser,
    getMe,
};
