"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../../../config"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const jwtHelpers_1 = require("../../../helpers/jwtHelpers");
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const loginUser = async (payload) => {
    const { email, password } = payload;
    const isUserExist = await prisma_1.default.user.findUnique({
        where: { email },
    });
    if (!isUserExist) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'User not registered');
    }
    if (password && !(await bcrypt_1.default.compare(password, isUserExist.password))) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, 'Password does not match');
    }
    const { id: userId, email: userEmail, role } = isUserExist;
    const accessToken = jwtHelpers_1.jwtHelpers.createToken({ id: userId, userEmail, role }, config_1.default.jwt.secret, config_1.default.jwt.expires_in);
    return {
        accessToken,
        user: {
            id: String(isUserExist.id),
            name: isUserExist.name,
            email: isUserExist.email,
            role: isUserExist.role,
        },
    };
};
const registerUser = async (payload) => {
    const isUserExist = await prisma_1.default.user.findUnique({
        where: { email: payload.email },
    });
    if (isUserExist) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'User already exists');
    }
    // Hash password
    const hashedPassword = await bcrypt_1.default.hash(payload.password, 10);
    payload.password = hashedPassword;
    const result = await prisma_1.default.user.create({
        data: payload,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    return result;
};
const getMe = async (email) => {
    const result = await prisma_1.default.user.findUnique({
        where: { email },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    return result;
};
exports.AuthService = {
    loginUser,
    registerUser,
    getMe,
};
