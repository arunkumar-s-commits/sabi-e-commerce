"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./routes"));
const rateLimiter_middleware_1 = require("./middleware/rateLimiter.middleware");
const error_middleware_1 = require("./middleware/error.middleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Security and Logging Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: '*', // In production, replace with specific domain(s)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Health Check API
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'development',
    });
});
// Mount Routes & Rate Limiting
app.use('/api', rateLimiter_middleware_1.apiRateLimiter, routes_1.default);
// Fallbacks & Exception Handlers
app.use(error_middleware_1.notFoundHandler);
app.use(error_middleware_1.errorHandler);
// Launch Express Server
app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`  Sabi Return Gifts API Server Running Online  `);
    console.log(`  Port: ${PORT}                               `);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'} `);
    console.log(`=============================================`);
});
exports.default = app;
