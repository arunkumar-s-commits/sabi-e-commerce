"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message = 'Success', status = 200, pagination) => {
    const response = {
        success: true,
        message,
        data,
    };
    if (pagination) {
        response.pagination = pagination;
    }
    return res.status(status).json(response);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, error, status = 500, details) => {
    return res.status(status).json({
        success: false,
        error,
        details,
    });
};
exports.sendError = sendError;
