"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const product_routes_1 = __importDefault(require("./product.routes"));
const category_routes_1 = __importDefault(require("./category.routes"));
const coupon_routes_1 = __importDefault(require("./coupon.routes"));
const review_routes_1 = __importDefault(require("./review.routes"));
const order_routes_1 = __importDefault(require("./order.routes"));
const lead_routes_1 = __importDefault(require("./lead.routes"));
const analytics_routes_1 = __importDefault(require("./analytics.routes"));
const settings_routes_1 = __importDefault(require("./settings.routes"));
const router = (0, express_1.Router)();
// Mount modules
router.use('/auth', auth_routes_1.default);
router.use('/products', product_routes_1.default);
router.use('/categories', category_routes_1.default);
router.use('/coupons', coupon_routes_1.default);
router.use('/reviews', review_routes_1.default);
router.use('/orders', order_routes_1.default);
router.use('/leads', lead_routes_1.default);
router.use('/analytics', analytics_routes_1.default);
router.use('/settings', settings_routes_1.default);
exports.default = router;
