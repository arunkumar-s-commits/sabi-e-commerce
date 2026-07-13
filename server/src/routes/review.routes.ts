import { Router, Request } from 'express';
import { body } from 'express-validator';
import { db } from '../config/firebase';
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
    const snapshot = await db
      .collection('reviews')
      .where('productId', '==', productId)
      .where('approved', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    const reviews: any[] = [];
    snapshot.forEach((doc) => {
      reviews.push(doc.data());
    });

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
      const productRef = db.collection('products').doc(productId);
      const productDoc = await productRef.get();
      if (!productDoc.exists) {
        return sendError(res, 'Product not found', 404);
      }

      const reviewRef = db.collection('reviews').doc();
      const newReview = {
        id: reviewRef.id,
        productId,
        userId: uid,
        userName: name || email?.split('@')[0] || 'Anonymous',
        rating: Number(rating),
        comment,
        images: images || [],
        approved: false, // Moderated by default
        featured: false,
        createdAt: new Date().toISOString(),
      };

      await reviewRef.set(newReview);
      return sendSuccess(
        res,
        newReview,
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
    const snapshot = await db.collection('reviews').orderBy('createdAt', 'desc').get();
    const reviews: any[] = [];
    snapshot.forEach((doc) => {
      reviews.push(doc.data());
    });
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
      const reviewRef = db.collection('reviews').doc(id);
      const doc = await reviewRef.get();

      if (!doc.exists) {
        return sendError(res, 'Review not found', 404);
      }

      const { approved, featured } = req.body;
      const updateData: any = {};
      if (approved !== undefined) updateData.approved = approved;
      if (featured !== undefined) updateData.featured = featured;

      await reviewRef.update(updateData);

      // Recalculate product overall rating if approved state changed
      if (approved === true) {
        const reviewData = doc.data()!;
        const productId = reviewData.productId;

        const allReviewsSnapshot = await db
          .collection('reviews')
          .where('productId', '==', productId)
          .where('approved', '==', true)
          .get();

        let totalRating = reviewData.rating;
        let count = 1;

        allReviewsSnapshot.forEach((rDoc) => {
          if (rDoc.id !== id) {
            totalRating += rDoc.data().rating;
            count++;
          }
        });

        const newAvg = Number((totalRating / count).toFixed(1));
        await db.collection('products').doc(productId).update({
          rating: newAvg,
          reviewsCount: count,
        });
      }

      const updatedDoc = await reviewRef.get();
      return sendSuccess(res, updatedDoc.data(), 'Review status updated');
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
    const reviewRef = db.collection('reviews').doc(id);
    const doc = await reviewRef.get();

    if (!doc.exists) {
      return sendError(res, 'Review not found', 404);
    }

    await reviewRef.delete();
    return sendSuccess(res, { id }, 'Review deleted successfully');
  } catch (error) {
    console.error('Error deleting review:', error);
    return sendError(res, 'Failed to delete review', 500);
  }
});

export default router;
