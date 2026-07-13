"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
const response_1 = require("../utils/response");
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorDetails = errors.array().map((err) => ({
            field: err.type === 'field' ? err.path : err.type,
            message: err.msg,
        }));
        return (0, response_1.sendError)(res, 'Validation error', 400, errorDetails);
    }
    next();
};
exports.validateRequest = validateRequest;
