"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_routes_1 = require("../modules/auth/auth.routes");
const category_routes_1 = require("../modules/category/category.routes");
const product_routes_1 = require("../modules/product/product.routes");
const order_routes_1 = require("../modules/order/order.routes");
const restock_routes_1 = require("../modules/restock/restock.routes");
const dashboard_routes_1 = require("../modules/dashboard/dashboard.routes");
const activity_log_routes_1 = require("../modules/activity-log/activity-log.routes");
const router = express_1.default.Router();
const moduleRoutes = [
    {
        path: '/auth',
        route: auth_routes_1.AuthRoutes,
    },
    {
        path: '/categories',
        route: category_routes_1.CategoryRoutes,
    },
    {
        path: '/products',
        route: product_routes_1.ProductRoutes,
    },
    {
        path: '/orders',
        route: order_routes_1.OrderRoutes,
    },
    {
        path: '/restock-queue',
        route: restock_routes_1.RestockRoutes,
    },
    {
        path: '/dashboard',
        route: dashboard_routes_1.DashboardRoutes,
    },
    {
        path: '/activity-logs',
        route: activity_log_routes_1.ActivityLogRoutes,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
