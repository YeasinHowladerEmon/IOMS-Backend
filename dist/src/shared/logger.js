"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const logger = {
    info: (message, context) => {
        console.log(`[INFO] ${message}`, context || '');
    },
    error: (message, context) => {
        console.error(`[ERROR] ${message}`, context || '');
    },
    debug: (message, context) => {
        console.debug(`[DEBUG] ${message}`, context || '');
    },
    warn: (message, context) => {
        console.warn(`[WARN] ${message}`, context || '');
    },
};
exports.default = logger;
