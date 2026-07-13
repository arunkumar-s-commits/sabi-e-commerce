import { Router, Request } from 'express';
import { body } from 'express-validator';
import { db } from '../config/firebase';
import { razorpay, verifyPaymentSignature } from '../config/razorpay';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// @route   POST /api/orders/create-payment
// @desc    Initiate Razorpay payment order
// @access  Private
router.post(
  '/create-payment',
  requireAuth,
  [
    body('items').isArray({ min: 1 }).withMessage('Items list must be provided'),
    body('items.*.productId').notEmpty().withMessage('Product ID is required for each item'),
    body('items.*.qty').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('couponCode').optional().isString(),
    body('giftWrapping').optional().isBoolean(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { items, couponCode, giftWrapping } = req.body;
      let subtotal = 0;

      // Secure pricing check by fetching from DB instead of relying on frontend
      for (const item of items) {
        const prodDoc = await db.collection('products').doc(item.productId).get();
        if (!prodDoc.exists) {
          return sendError(res, `Product ${item.productId} not found`, 404);
        }
        const prodData = prodDoc.data()!;
        
        let itemPrice = prodData.price;
        if (item.variantId) {
          const variant = prodData.variants?.find((v: any) => v.id === item.variantId);
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
        const couponDoc = await db.collection('coupons').doc(couponCode.toUpperCase().trim()).get();
        if (couponDoc.exists) {
          const coupon = couponDoc.data()!;
          if (
            coupon.isActive &&
            new Date(coupon.expiryDate).getTime() > Date.now() &&
            subtotal >= coupon.minOrderValue
          ) {
            if (coupon.type === 'percentage') {
              discount = Math.round((subtotal * coupon.value) / 100);
            } else if (coupon.type === 'flat') {
              discount = coupon.value;
            } else if (coupon.type === 'free_shipping') {
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
        const rzpOrder = await razorpay.orders.create(options);
        return sendSuccess(res, {
          orderId: rzpOrder.id,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          subtotal,
          shipping,
          discount,
          giftWrappingCharge: wrapCharge,
          total,
        }, 'Razorpay payment initialized');
      } catch (rzpErr) {
        console.warn('Razorpay error, entering Mock Payment fallback:', rzpErr);
        // Dev Mock payment option if keys are invalid/missing
        return sendSuccess(res, {
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
    } catch (error) {
      console.error('Error creating payment:', error);
      return sendError(res, 'Failed to create payment order', 500);
    }
  }
);

// @route   POST /api/orders/verify-payment
// @desc    Verify payment signature and create Firestore Order record
// @access  Private
router.post(
  '/verify-payment',
  requireAuth,
  [
    body('items').isArray({ min: 1 }).withMessage('Items required'),
    body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
    body('billingAddress').notEmpty().withMessage('BillingAddress is required'),
    body('pricing').notEmpty().withMessage('Pricing details are required'),
    body('paymentMethod').isIn(['Razorpay', 'COD']).withMessage('Invalid payment method'),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { uid, email, name } = req.user!;
      const {
        items,
        shippingAddress,
        billingAddress,
        pricing,
        paymentMethod,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        giftWrapping,
        couponApplied,
      } = req.body;

      // Signature Verification for Razorpay (skip if COD or mock order)
      if (paymentMethod === 'Razorpay' && !razorpayOrderId?.startsWith('rzp_mock_')) {
        const isValid = verifyPaymentSignature(
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature
        );
        if (!isValid) {
          return sendError(res, 'Payment signature verification failed. Secure check failed.', 400);
        }
      }

      // Check and update stock for all items
      const batch = db.batch();
      for (const item of items) {
        const prodRef = db.collection('products').doc(item.productId);
        const prodDoc = await prodRef.get();
        if (!prodDoc.exists) {
          return sendError(res, `Product ${item.productId} not found`, 404);
        }
        const data = prodDoc.data()!;
        
        if (item.variantId) {
          const variants = data.variants || [];
          const vIdx = variants.findIndex((v: any) => v.id === item.variantId);
          if (vIdx === -1) {
            return sendError(res, `Variant ${item.variantId} not found on product`, 400);
          }
          if (variants[vIdx].stock < item.qty) {
            return sendError(res, `Insufficient stock for variant ${variants[vIdx].color || variants[vIdx].size}`, 400);
          }
          variants[vIdx].stock -= item.qty;
          const totalStock = variants.reduce((sum: number, v: any) => sum + v.stock, 0);
          batch.update(prodRef, { variants, stock: totalStock });
        } else {
          if (data.stock < item.qty) {
            return sendError(res, `Insufficient stock for product ${data.title}`, 400);
          }
          batch.update(prodRef, { stock: data.stock - item.qty });
        }
      }

      // Write Order Doc
      const orderRef = db.collection('orders').doc();
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

      return sendSuccess(res, newOrder, 'Order placed successfully', 201);
    } catch (error) {
      console.error('Error verifying payment/creating order:', error);
      return sendError(res, 'Failed to complete checkout process', 500);
    }
  }
);

// @route   GET /api/orders/my-orders
// @desc    Get order history for current customer
// @access  Private
router.get('/my-orders', requireAuth, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { uid } = req.user!;
    const snapshot = await db
      .collection('orders')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();

    const orders: any[] = [];
    snapshot.forEach((doc) => {
      orders.push(doc.data());
    });

    return sendSuccess(res, orders, 'User orders fetched successfully');
  } catch (error) {
    console.error('Error getting user orders:', error);
    return sendError(res, 'Failed to fetch order history', 500);
  }
});

// @route   GET /api/orders/:id
// @desc    Get details of a specific order
// @access  Private
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { uid, role } = req.user!;
    const orderDoc = await db.collection('orders').doc(req.params.id).get();

    if (!orderDoc.exists) {
      return sendError(res, 'Order not found', 404);
    }

    const orderData = orderDoc.data()!;
    // Secure authorization - only admin or owner can read
    if (role !== 'admin' && orderData.userId !== uid) {
      return sendError(res, 'Unauthorized to view this order', 403);
    }

    return sendSuccess(res, orderData, 'Order details fetched');
  } catch (error) {
    console.error('Error fetching order details:', error);
    return sendError(res, 'Failed to fetch order details', 500);
  }
});

// @route   GET /api/orders/admin/all
// @desc    Get all orders (Admin only)
// @access  Private/Admin
router.get('/admin/all', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: any) => {
  try {
    const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();
    const orders: any[] = [];
    snapshot.forEach((doc) => {
      orders.push(doc.data());
    });
    return sendSuccess(res, orders, 'All orders fetched successfully');
  } catch (error) {
    console.error('Error fetching all orders:', error);
    return sendError(res, 'Failed to fetch orders', 500);
  }
});

// @route   PUT /api/orders/admin/:id
// @desc    Update order status / tracking details (Admin only)
// @access  Private/Admin
router.put(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  [
    body('status')
      .isIn(['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'])
      .withMessage('Invalid order status'),
    body('trackingNumber').optional().isString(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const orderRef = db.collection('orders').doc(req.params.id);
      const doc = await orderRef.get();

      if (!doc.exists) {
        return sendError(res, 'Order not found', 404);
      }

      const { status, trackingNumber } = req.body;
      const updateData: any = {
        status,
        updatedAt: new Date().toISOString(),
      };

      if (trackingNumber !== undefined) {
        updateData.trackingNumber = trackingNumber;
      }

      await orderRef.update(updateData);
      const updatedDoc = await orderRef.get();

      return sendSuccess(res, updatedDoc.data(), 'Order status updated successfully');
    } catch (error) {
      console.error('Error updating order:', error);
      return sendError(res, 'Failed to update order details', 500);
    }
  }
);

export default router;
