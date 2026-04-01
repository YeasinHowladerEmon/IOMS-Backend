"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestockRoutes = void 0;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const restock_controller_1 = require("./restock.controller");
const router = express_1.default.Router();
router.get('/', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.DEMO_USER), restock_controller_1.RestockController.getRestockQueue);
router.patch('/:productId/restock', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.MANAGER), restock_controller_1.RestockController.restockProduct);
router.delete('/:productId', (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.MANAGER), restock_controller_1.RestockController.removeFromQueue);
exports.RestockRoutes = router;
