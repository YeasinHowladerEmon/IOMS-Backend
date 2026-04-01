"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestockController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const restock_service_1 = require("./restock.service");
const getRestockQueue = (0, catchAsync_1.default)(async (req, res) => {
    const result = await restock_service_1.RestockService.getRestockQueue();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Restock queue fetched successfully',
        data: result,
    });
});
const restockProduct = (0, catchAsync_1.default)(async (req, res) => {
    const productId = req.params.productId;
    const { stockToAdd } = req.body;
    await restock_service_1.RestockService.restockProduct(productId, stockToAdd);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Product restocked successfully',
    });
});
const removeFromQueue = (0, catchAsync_1.default)(async (req, res) => {
    const productId = req.params.productId;
    await restock_service_1.RestockService.removeFromQueue(productId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Product removed from restock queue',
    });
});
exports.RestockController = {
    getRestockQueue,
    restockProduct,
    removeFromQueue,
};
