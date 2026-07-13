import { Router, Request } from 'express';
import { body } from 'express-validator';
import { supabase } from '../config/supabase';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// @route   GET /api/coupons
// @desc    Get all active coupons (public)
// @access  Public
router.get('/', async (req: Request, res: any) => {
  try {
    const { data: snapshot, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('isActive', true);
      
    if (error) throw error;
    
    const coupons: any[] = [];
    if (snapshot) {
      snapshot.forEach((data: any) => {
        // Only return non-expired coupons
        if (new Date(data.expiryDate).getTime() > Date.now()) {
          coupons.push(data);
        }
      });
    }
    return sendSuccess(res, coupons, 'Coupons fetched successfully');
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return sendError(res, 'Failed to fetch coupons', 500);
  }
});

// @route   POST /api/coupons/validate
// @desc    Validate a coupon code against a purchase amount
// @access  Private
router.post(
  '/validate',
  requireAuth,
  [
    body('code').notEmpty().withMessage('Coupon code is required'),
    body('subtotal').isNumeric().withMessage('Subtotal must be a number'),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const code = (req.body.code as string).toUpperCase().trim();
      const subtotal = parseFloat(req.body.subtotal);

      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .single();

      if (error || !coupon) {
        return sendError(res, 'Invalid coupon code.', 400);
      }

      if (!coupon.isActive) {
        return sendError(res, 'This coupon is no longer active.', 400);
      }

      if (new Date(coupon.expiryDate).getTime() < Date.now()) {
        return sendError(res, 'This coupon has expired.', 400);
      }

      if (subtotal < coupon.minOrderValue) {
        return sendError(
          res,
          `Minimum order value of ₹${coupon.minOrderValue} is required to use this coupon.`,
          400
        );
      }

      let discountAmount = 0;
      if (coupon.type === 'percentage') {
        discountAmount = Math.round((subtotal * coupon.value) / 100);
      } else if (coupon.type === 'flat') {
        discountAmount = coupon.value;
      } else if (coupon.type === 'free_shipping') {
        discountAmount = 0; // Handled separately in shipping cost deduction
      }

      return sendSuccess(
        res,
        {
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          discountAmount,
        },
        'Coupon code applied successfully'
      );
    } catch (error) {
      console.error('Error validating coupon:', error);
      return sendError(res, 'Failed to validate coupon', 500);
    }
  }
);

// @route   POST /api/coupons
// @desc    Create a new coupon code (Admin only)
// @access  Private/Admin
router.post(
  '/',
  requireAuth,
  requireAdmin,
  [
    body('code').notEmpty().withMessage('Code is required'),
    body('type').isIn(['percentage', 'flat', 'free_shipping']).withMessage('Invalid coupon type'),
    body('value').isNumeric().withMessage('Value must be a number'),
    body('minOrderValue').isNumeric().withMessage('Minimum order value must be a number'),
    body('expiryDate').notEmpty().withMessage('Expiry date is required'),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const code = req.body.code.toUpperCase().trim();
      
      const { data: doc } = await supabase.from('coupons').select('code').eq('code', code).single();

      if (doc) {
        return sendError(res, 'Coupon code already exists', 400);
      }

      const newCoupon = {
        code,
        type: req.body.type,
        value: Number(req.body.value),
        minOrderValue: Number(req.body.minOrderValue),
        expiryDate: new Date(req.body.expiryDate).toISOString(),
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      };

      const { error: insertError } = await supabase.from('coupons').insert([newCoupon]);
      if (insertError) throw insertError;

      return sendSuccess(res, newCoupon, 'Coupon created successfully', 201);
    } catch (error) {
      console.error('Error creating coupon:', error);
      return sendError(res, 'Failed to create coupon', 500);
    }
  }
);

// @route   DELETE /api/coupons/:code
// @desc    Delete a coupon code (Admin only)
// @access  Private/Admin
router.delete('/:code', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: any) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    const { data: doc } = await supabase.from('coupons').select('code').eq('code', code).single();

    if (!doc) {
      return sendError(res, 'Coupon not found', 404);
    }

    const { error } = await supabase.from('coupons').delete().eq('code', code);
    if (error) throw error;
    
    return sendSuccess(res, { code }, 'Coupon deleted successfully');
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return sendError(res, 'Failed to delete coupon', 500);
  }
});

export default router;
