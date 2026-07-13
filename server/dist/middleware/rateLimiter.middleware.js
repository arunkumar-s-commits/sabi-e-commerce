"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = exports.apiRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const response_1 = require("../utils/response");
exports.apiRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        return (0, response_1.sendError)(res, 'Too many requests from this IP, please try again after 15 minutes.', 429);
    },
});
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 auth requests per hour
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        return (0, response_1.sendError)(res, 'Too many login/register attempts from this IP, please try again after an hour.', 429);
    },
});
