"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const firebase_1 = require("../config/firebase");
const razorpay_1 = require("../config/razorpay");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
// @route   POST /api/orders/create-payment
// @desc    Initiate Razorpay payment order
// @access  Private
router.post('/create-payment', auth_middleware_1.requireAuth, [
    (0, express_validator_1.body)('items').isArray({ min: 1 }).withMessage('Items list must be provided'),
    (0, express_validator_1.body)('items.*.productId').notEmpty().withMessage('Product ID is required for each item'),
    (0, express_validator_1.body)('items.*.qty').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    (0, express_validator_1.body)('couponCode').optional().isString(),
    (0, express_validator_1.body)('giftWrapping').optional().isBoolean(),
], validation_middleware_1.validateRequest, async (req, res) => {
    try {
        const { items, couponCode, giftWrapping } = req.body;
        let subtotal = 0;
        // Secure pricing check by fetching from DB instead of relying on frontend
        for (const item of items) {
            const prodDoc = await firebase_1.db.collection('products').doc(item.productId).get();
            if (!prodDoc.exists) {
                return (0, response_1.sendError)(res, `Product ${item.productId} not found`, 404);
            }
            const prodData = prodDoc.data();
            let itemPrice = prodData.price;
            if (item.variantId) {
                const variant = prodData.variants?.find((v) => v.id === item.variantId);
                if (variant) {
                    itemPrice = variant.price;
                }
            }
            subtotal += itemPrice * item.qty;
        }
        // Calculate Shipping (free above ₹1000)
        let shipping = subtotal >= 1000 ? 0 : 99;
        // Handle Coupon Discount
        let discount = 0;
        if (couponCode) {
            const couponDoc = await firebase_1.db.collection('coupons').doc(couponCode.toUpperCase().trim()).get();
            if (couponDoc.exists) {
                const coupon = couponDoc.data();
                if (coupon.isActive &&
                    new Date(coupon.expiryDate).getTime() > Date.now() &&
                    subtotal >= coupon.minOrderValue) {
                    if (coupon.type === 'percentage') {
                        discount = Math.round((subtotal * coupon.value) / 100);
                    }
                    else if (coupon.type === 'flat') {
                        discount = coupon.value;
                    }
                    else if (coupon.type === 'free_shipping') {
                        shipping = 0;
                    }
                }
            }
        }
        // Extra charges (e.g. Gift wrapping ₹30)
        const wrapCharge = giftWrapping ? 30 : 0;
        const total = subtotal + shipping + wrapCharge - discount;
        // Generate Razorpay Order
        const amountInPaise = Math.round(total * 100);
        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `rcpt_${Date.now()}`,
        };
        try {
            const rzpOrder = await razorpay_1.razorpay.orders.create(options);
            return (0, response_1.sendSuccess)(res, {
                orderId: rzpOrder.id,
                amount: rzpOrder.amount,
                currency: rzpOrder.currency,
                subtotal,
                shipping,
                discount,
                giftWrappingCharge: wrapCharge,
                total,
            }, 'Razorpay payment initialized');
        }
        catch (rzpErr) {
            console.warn('Razorpay error, entering Mock Payment fallback:', rzpErr);
            // Dev Mock payment option if keys are invalid/missing
            return (0, response_1.sendSuccess)(res, {
                orderId: `rzp_mock_${Date.now()}`,
                amount: amountInPaise,
                currency: 'INR',
                subtotal,
                shipping,
                discount,
                giftWrappingCharge: wrapCharge,
                total,
                isMock: true
            }, 'Mock Payment initialized');
        }
    }
    catch (error) {
        console.error('Error creating payment:', error);
        return (0, response_1.sendError)(res, 'Failed to create payment order', 500);
    }
});
// @route   POST /api/orders/verify-payment
// @desc    Verify payment signature and create Firestore Order record
// @access  Private
router.post('/verify-payment', auth_middleware_1.requireAuth, [
    (0, express_validator_1.body)('items').isArray({ min: 1 }).withMessage('Items required'),
    (0, express_validator_1.body)('shippingAddress').notEmpty().withMessage('Shipping address is required'),
    (0, express_validator_1.body)('billingAddress').notEmpty().withMessage('BillingAddress is required'),
    (0, express_validator_1.body)('pricing').notEmpty().withMessage('Pricing details are required'),
    (0, express_validator_1.body)('paymentMethod').isIn(['Razorpay', 'COD']).withMessage('Invalid payment method'),
], validation_middleware_1.validateRequest, async (req, res) => {
    try {
        const { uid, email, name } = req.user;
        const { items, shippingAddress, billingAddress, pricing, paymentMethod, razorpayOrderId, razorpayPaymentId, razorpaySignature, giftWrapping, couponApplied, } = req.body;
        // Signature Verification for Razorpay (skip if COD or mock order)
        if (paymentMethod === 'Razorpay' && !razorpayOrderId?.startsWith('rzp_mock_')) {
            const isValid = (0, razorpay_1.verifyPaymentSignature)(razorpayOrderId, razorpayPaymentId, razorpaySignature);
            if (!isValid) {
                return (0, response_1.sendError)(res, 'Payment signature verification failed. Secure check failed.', 400);
            }
        }
        // Check and update stock for all items
        const batch = firebase_1.db.batch();
        for (const item of items) {
            const prodRef = firebase_1.db.collection('products').doc(item.productId);
            const prodDoc = await prodRef.get();
            if (!prodDoc.exists) {
                return (0, response_1.sendError)(res, `Product ${item.productId} not found`, 404);
            }
            const data = prodDoc.data();
            if (item.variantId) {
                const variants = data.variants || [];
                const vIdx = variants.findIndex((v) => v.id === item.variantId);
                if (vIdx === -1) {
                    return (0, response_1.sendError)(res, `Variant ${item.variantId} not found on product`, 400);
                }
                if (variants[vIdx].stock < item.qty) {
                    return (0, response_1.sendError)(res, `Insufficient stock for variant ${variants[vIdx].color || variants[vIdx].size}`, 400);
                }
                variants[vIdx].stock -= item.qty;
                const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
                batch.update(prodRef, { variants, stock: totalStock });
            }
            else {
                if (data.stock < item.qty) {
                    return (0, response_1.sendError)(res, `Insufficient stock for product ${data.title}`, 400);
                }
                batch.update(prodRef, { stock: data.stock - item.qty });
            }
        }
        // Write Order Doc
        const orderRef = firebase_1.db.collection('orders').doc();
        const newOrder = {
            id: orderRef.id,
            userId: uid,
            customerName: name || email?.split('@')[0] || 'Guest',
            items,
            shippingAddress,
            billingAddress,
            pricing,
            payment: {
                method: paymentMethod,
                transactionId: razorpayPaymentId || `cod_${Date.now()}`,
                status: paymentMethod === 'Razorpay' ? 'success' : 'pending',
            },
            status: 'pending',
            trackingNumber: '',
            giftWrapping: giftWrapping || false,
            couponApplied: couponApplied || '',
            invoiceUrl: `/invoices/inv_${orderRef.id}.pdf`, // Generated on client or served dynamically
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        batch.set(orderRef, newOrder);
        await batch.commit();
        return (0, response_1.sendSuccess)(res, newOrder, 'Order placed successfully', 201);
    }
    catch (error) {
        console.error('Error verifying payment/creating order:', error);
        return (0, response_1.sendError)(res, 'Failed to complete checkout process', 500);
    }
});
// @route   GET /api/orders/my-orders
// @desc    Get order history for current customer
// @access  Private
router.get('/my-orders', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { uid } = req.user;
        const snapshot = await firebase_1.db
            .collection('orders')
            .where('userId', '==', uid)
            .orderBy('createdAt', 'desc')
            .get();
        const orders = [];
        snapshot.forEach((doc) => {
            orders.push(doc.data());
        });
        return (0, response_1.sendSuccess)(res, orders, 'User orders fetched successfully');
    }
    catch (error) {
        console.error('Error getting user orders:', error);
        return (0, response_1.sendError)(res, 'Failed to fetch order history', 500);
    }
});
// @route   GET /api/orders/:id
// @desc    Get details of a specific order
// @access  Private
router.get('/:id', auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const { uid, role } = req.user;
        const orderDoc = await firebase_1.db.collection('orders').doc(req.params.id).get();
        if (!orderDoc.exists) {
            return (0, response_1.sendError)(res, 'Order not found', 404);
        }
        const orderData = orderDoc.data();
        // Secure authorization - only admin or owner can read
        if (role !== 'admin' && orderData.userId !== uid) {
            return (0, response_1.sendError)(res, 'Unauthorized to view this order', 403);
        }
        return (0, response_1.sendSuccess)(res, orderData, 'Order details fetched');
    }
    catch (error) {
        console.error('Error fetching order details:', error);
        return (0, response_1.sendError)(res, 'Failed to fetch order details', 500);
    }
});
// @route   GET /api/orders/admin/all
// @desc    Get all orders (Admin only)
// @access  Private/Admin
router.get('/admin/all', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, async (req, res) => {
    try {
        const snapshot = await firebase_1.db.collection('orders').orderBy('createdAt', 'desc').get();
        const orders = [];
        snapshot.forEach((doc) => {
            orders.push(doc.data());
        });
        return (0, response_1.sendSuccess)(res, orders, 'All orders fetched successfully');
    }
    catch (error) {
        console.error('Error fetching all orders:', error);
        return (0, response_1.sendError)(res, 'Failed to fetch orders', 500);
    }
});
// @route   PUT /api/orders/admin/:id
// @desc    Update order status / tracking details (Admin only)
// @access  Private/Admin
router.put('/admin/:id', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, [
    (0, express_validator_1.body)('status')
        .isIn(['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'])
        .withMessage('Invalid order status'),
    (0, express_validator_1.body)('trackingNumber').optional().isString(),
], validation_middleware_1.validateRequest, async (req, res) => {
    try {
        const orderRef = firebase_1.db.collection('orders').doc(req.params.id);
        const doc = await orderRef.get();
        if (!doc.exists) {
            return (0, response_1.sendError)(res, 'Order not found', 404);
        }
        const { status, trackingNumber } = req.body;
        const updateData = {
            status,
            updatedAt: new Date().toISOString(),
        };
        if (trackingNumber !== undefined) {
            updateData.trackingNumber = trackingNumber;
        }
        await orderRef.update(updateData);
        const updatedDoc = await orderRef.get();
        return (0, response_1.sendSuccess)(res, updatedDoc.data(), 'Order status updated successfully');
    }
    catch (error) {
        console.error('Error updating order:', error);
        return (0, response_1.sendError)(res, 'Failed to update order details', 500);
    }
});
exports.default = router;
