"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const firebase_1 = require("../config/firebase");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
const SEED_COUPONS = [
    {
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        minOrderValue: 500,
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
        isActive: true,
    },
    {
        code: 'SABI500',
        type: 'flat',
        value: 500,
        minOrderValue: 3000,
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
        isActive: true,
    },
    {
        code: 'FREESHIP',
        type: 'free_shipping',
        value: 0,
        minOrderValue: 1000,
        expiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
    }
];
// Seed Coupons
const seedCouponsIfEmpty = async () => {
    try {
        const snap = await firebase_1.db.collection('coupons').limit(1).get();
        if (snap.empty) {
            console.log('Seeding initial coupons...');
            const batch = firebase_1.db.batch();
            for (const coup of SEED_COUPONS) {
                const docRef = firebase_1.db.collection('coupons').doc(coup.code);
                batch.set(docRef, coup);
            }
            await batch.commit();
            console.log('Initial coupons seeded.');
        }
    }
    catch (err) {
        console.error('Error seeding coupons:', err);
    }
};
seedCouponsIfEmpty();
// @route   GET /api/coupons
// @desc    Get all active coupons (public)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const snapshot = await firebase_1.db.collection('coupons').where('isActive', '==', true).get();
        const coupons = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            // Only return non-expired coupons
            if (new Date(data.expiryDate).getTime() > Date.now()) {
                coupons.push(data);
            }
        });
        return (0, response_1.sendSuccess)(res, coupons, 'Coupons fetched successfully');
    }
    catch (error) {
        console.error('Error fetching coupons:', error);
        return (0, response_1.sendError)(res, 'Failed to fetch coupons', 500);
    }
});
// @route   POST /api/coupons/validate
// @desc    Validate a coupon code against a purchase amount
// @access  Private
router.post('/validate', auth_middleware_1.requireAuth, [
    (0, express_validator_1.body)('code').notEmpty().withMessage('Coupon code is required'),
    (0, express_validator_1.body)('subtotal').isNumeric().withMessage('Subtotal must be a number'),
], validation_middleware_1.validateRequest, async (req, res) => {
    try {
        const code = req.body.code.toUpperCase().trim();
        const subtotal = parseFloat(req.body.subtotal);
        const couponRef = firebase_1.db.collection('coupons').doc(code);
        const doc = await couponRef.get();
        if (!doc.exists) {
            return (0, response_1.sendError)(res, 'Invalid coupon code.', 400);
        }
        const coupon = doc.data();
        if (!coupon.isActive) {
            return (0, response_1.sendError)(res, 'This coupon is no longer active.', 400);
        }
        if (new Date(coupon.expiryDate).getTime() < Date.now()) {
            return (0, response_1.sendError)(res, 'This coupon has expired.', 400);
        }
        if (subtotal < coupon.minOrderValue) {
            return (0, response_1.sendError)(res, `Minimum order value of ₹${coupon.minOrderValue} is required to use this coupon.`, 400);
        }
        let discountAmount = 0;
        if (coupon.type === 'percentage') {
            discountAmount = Math.round((subtotal * coupon.value) / 100);
        }
        else if (coupon.type === 'flat') {
            discountAmount = coupon.value;
        }
        else if (coupon.type === 'free_shipping') {
            discountAmount = 0; // Handled separately in shipping cost deduction
        }
        return (0, response_1.sendSuccess)(res, {
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            discountAmount,
        }, 'Coupon code applied successfully');
    }
    catch (error) {
        console.error('Error validating coupon:', error);
        return (0, response_1.sendError)(res, 'Failed to validate coupon', 500);
    }
});
// @route   POST /api/coupons
// @desc    Create a new coupon code (Admin only)
// @access  Private/Admin
router.post('/', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, [
    (0, express_validator_1.body)('code').notEmpty().withMessage('Code is required'),
    (0, express_validator_1.body)('type').isIn(['percentage', 'flat', 'free_shipping']).withMessage('Invalid coupon type'),
    (0, express_validator_1.body)('value').isNumeric().withMessage('Value must be a number'),
    (0, express_validator_1.body)('minOrderValue').isNumeric().withMessage('Minimum order value must be a number'),
    (0, express_validator_1.body)('expiryDate').notEmpty().withMessage('Expiry date is required'),
], validation_middleware_1.validateRequest, async (req, res) => {
    try {
        const code = req.body.code.toUpperCase().trim();
        const docRef = firebase_1.db.collection('coupons').doc(code);
        const doc = await docRef.get();
        if (doc.exists) {
            return (0, response_1.sendError)(res, 'Coupon code already exists', 400);
        }
        const newCoupon = {
            code,
            type: req.body.type,
            value: Number(req.body.value),
            minOrderValue: Number(req.body.minOrderValue),
            expiryDate: new Date(req.body.expiryDate).toISOString(),
            isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        };
        await docRef.set(newCoupon);
        return (0, response_1.sendSuccess)(res, newCoupon, 'Coupon created successfully', 201);
    }
    catch (error) {
        console.error('Error creating coupon:', error);
        return (0, response_1.sendError)(res, 'Failed to create coupon', 500);
    }
});
// @route   DELETE /api/coupons/:code
// @desc    Delete a coupon code (Admin only)
// @access  Private/Admin
router.delete('/:code', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, async (req, res) => {
    try {
        const code = req.params.code.toUpperCase().trim();
        const docRef = firebase_1.db.collection('coupons').doc(code);
        const doc = await docRef.get();
        if (!doc.exists) {
            return (0, response_1.sendError)(res, 'Coupon not found', 404);
        }
        await docRef.delete();
        return (0, response_1.sendSuccess)(res, { code }, 'Coupon deleted successfully');
    }
    catch (error) {
        console.error('Error deleting coupon:', error);
        return (0, response_1.sendError)(res, 'Failed to delete coupon', 500);
    }
});
exports.default = router;
