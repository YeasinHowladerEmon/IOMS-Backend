"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const order_service_1 = require("./order.service");
const pick_1 = __importDefault(require("../../../shared/pick"));
const createOrder = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const userId = user?.id;
    const result = await order_service_1.OrderService.createOrder({
        ...req.body,
        userId: Number(userId),
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Order created successfully',
        data: result,
    });
});
const getAllOrders = (0, catchAsync_1.default)(async (req, res) => {
    const filters = (0, pick_1.default)(req.query, [
        'searchTerm',
        'status',
        'userId',
        'startDate',
        'endDate',
    ]);
    const paginationOptions = (0, pick_1.default)(req.query, [
        'page',
        'limit',
        'sortBy',
        'sortOrder',
    ]);
    const result = await order_service_1.OrderService.getAllOrders(filters, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Orders fetched successfully',
        meta: result.meta,
        data: result.data,
    });
});
const getOrderById = (0, catchAsync_1.default)(async (req, res) => {
    const id = req.params.id;
    const result = await order_service_1.OrderService.getOrderById(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Order fetched successfully',
        data: result,
    });
});
const updateOrderStatus = (0, catchAsync_1.default)(async (req, res) => {
    const id = req.params.id;
    const { status } = req.body;
    const result = await order_service_1.OrderService.updateOrderStatus(id, status);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Order status updated successfully',
        data: result,
    });
});
const cancelOrder = (0, catchAsync_1.default)(async (req, res) => {
    const id = req.params.id;
    const result = await order_service_1.OrderService.cancelOrder(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Order cancelled successfully',
        data: result,
    });
});
exports.OrderController = {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
};
