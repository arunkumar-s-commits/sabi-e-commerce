"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const response_1 = require("../utils/response");
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    console.error(`[Error] ${req.method} ${req.url}:`, {
        message,
        statusCode,
        details: err.details,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
    return (0, response_1.sendError)(res, message, statusCode, err.details);
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Route not found: ${req.method} ${req.url}`);
    error.statusCode = 404;
    next(error);
};
exports.notFoundHandler = notFoundHandler;
