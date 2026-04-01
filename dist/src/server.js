"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const prisma_1 = __importDefault(require("./shared/prisma"));
let server;
async function bootstrap() {
    try {
        await prisma_1.default.$connect();
        console.log(`🛢️  Database is connected successfully`);
        server = app_1.default.listen(config_1.default.port, () => {
            console.log(`🚀 Application listening on port ${config_1.default.port}`);
        });
    }
    catch (err) {
        console.error('Failed to connect database', err);
    }
    process.on('unhandledRejection', (error) => {
        if (server) {
            server.close(() => {
                console.error('Unhandled Rejection detected', error);
                process.exit(1);
            });
        }
        else {
            process.exit(1);
        }
    });
}
bootstrap();
process.on('uncaughtException', () => {
    console.log('Uncaught Exception detected ......');
    process.exit(1);
});
