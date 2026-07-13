import { Router, Request } from 'express';
import { body } from 'express-validator';
import { supabase } from '../config/supabase';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// @route   GET /api/reviews/product/:productId
// @desc    Get approved reviews for a specific product
// @access  Public
router.get('/product/:productId', async (req: Request, res: any) => {
  try {
    const { productId } = req.params;
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('productId', productId)
      .eq('approved', true)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return sendSuccess(res, reviews, 'Reviews fetched successfully');
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    return sendError(res, 'Failed to fetch reviews', 500);
  }
});

// @route   POST /api/reviews
// @desc    Submit a review for a product
// @access  Private
router.post(
  '/',
  requireAuth,
  [
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').notEmpty().withMessage('Review comment is required'),
    body('images').optional().isArray(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { uid, name, email } = req.user!;
      const { productId, rating, comment, images } = req.body;

      // Verify product exists
      const { data: productDoc } = await supabase.from('products').select('id').eq('id', productId).single();
      if (!productDoc) {
        return sendError(res, 'Product not found', 404);
      }

      const newReview = {
        productId,
        userId: uid,
        userName: name || email?.split('@')[0] || 'Anonymous',
        rating: Number(rating),
        comment,
        images: images || [],
        approved: false, // Moderated by default
        featured: false,
      };

      const { data: createdReview, error } = await supabase
        .from('reviews')
        .insert([newReview])
        .select()
        .single();
        
      if (error) throw error;

      return sendSuccess(
        res,
        createdReview,
        'Review submitted successfully! It will be visible once approved.',
        201
      );
    } catch (error) {
      console.error('Error submitting review:', error);
      return sendError(res, 'Failed to submit review', 500);
    }
  }
);

// @route   GET /api/reviews/admin
// @desc    Get all reviews for moderation (Admin only)
// @access  Private/Admin
router.get('/admin', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { data: reviews, error } = await supabase.from('reviews').select('*').order('createdAt', { ascending: false });
    if (error) throw error;
    
    return sendSuccess(res, reviews, 'All reviews fetched successfully');
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return sendError(res, 'Failed to fetch reviews', 500);
  }
});

// @route   PUT /api/reviews/admin/:id
// @desc    Moderate a review (approve, reject, feature) (Admin only)
// @access  Private/Admin
router.put(
  '/admin/:id',
  requireAuth,
  requireAdmin,
  [
    body('approved').optional().isBoolean(),
    body('featured').optional().isBoolean(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { id } = req.params;
      const { data: doc } = await supabase.from('reviews').select('*').eq('id', id).single();

      if (!doc) {
        return sendError(res, 'Review not found', 404);
      }

      const { approved, featured } = req.body;
      const updateData: any = {};
      if (approved !== undefined) updateData.approved = approved;
      if (featured !== undefined) updateData.featured = featured;

      await supabase.from('reviews').update(updateData).eq('id', id);

      // Recalculate product overall rating if approved state changed
      if (approved === true) {
        const productId = doc.productId;

        const { data: allReviews } = await supabase
          .from('reviews')
          .select('rating, id')
          .eq('productId', productId)
          .eq('approved', true);

        let totalRating = doc.rating;
        let count = 1;

        if (allReviews) {
          allReviews.forEach((rDoc: any) => {
            if (rDoc.id !== id) {
              totalRating += rDoc.rating;
              count++;
            }
          });
        }

        const newAvg = Number((totalRating / count).toFixed(1));
        await supabase.from('products').update({
          rating: newAvg,
          reviewsCount: count,
        }).eq('id', productId);
      }

      const { data: updatedDoc } = await supabase.from('reviews').select('*').eq('id', id).single();
      return sendSuccess(res, updatedDoc, 'Review status updated');
    } catch (error) {
      console.error('Error moderating review:', error);
      return sendError(res, 'Failed to update review status', 500);
    }
  }
);

// @route   DELETE /api/reviews/admin/:id
// @desc    Delete a review (Admin only)
// @access  Private/Admin
router.delete('/admin/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { id } = req.params;
    
    const { data: existing } = await supabase.from('reviews').select('id').eq('id', id).single();
    if (!existing) {
      return sendError(res, 'Review not found', 404);
    }

    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) throw error;
    
    return sendSuccess(res, { id }, 'Review deleted successfully');
  } catch (error) {
    console.error('Error deleting review:', error);
    return sendError(res, 'Failed to delete review', 500);
  }
});

export default router;
