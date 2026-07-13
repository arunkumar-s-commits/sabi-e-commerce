"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const firebase_1 = require("../config/firebase");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
// @route   GET /api/reviews/product/:productId
// @desc    Get approved reviews for a specific product
// @access  Public
router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const snapshot = await firebase_1.db
            .collection('reviews')
            .where('productId', '==', productId)
            .where('approved', '==', true)
            .orderBy('createdAt', 'desc')
            .get();
        const reviews = [];
        snapshot.forEach((doc) => {
            reviews.push(doc.data());
        });
        return (0, response_1.sendSuccess)(res, reviews, 'Reviews fetched successfully');
    }
    catch (error) {
        console.error('Error fetching product reviews:', error);
        return (0, response_1.sendError)(res, 'Failed to fetch reviews', 500);
    }
});
// @route   POST /api/reviews
// @desc    Submit a review for a product
// @access  Private
router.post('/', auth_middleware_1.requireAuth, [
    (0, express_validator_1.body)('productId').notEmpty().withMessage('Product ID is required'),
    (0, express_validator_1.body)('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    (0, express_validator_1.body)('comment').notEmpty().withMessage('Review comment is required'),
    (0, express_validator_1.body)('images').optional().isArray(),
], validation_middleware_1.validateRequest, async (req, res) => {
    try {
        const { uid, name, email } = req.user;
        const { productId, rating, comment, images } = req.body;
        // Verify product exists
        const productRef = firebase_1.db.collection('products').doc(productId);
        const productDoc = await productRef.get();
        if (!productDoc.exists) {
            return (0, response_1.sendError)(res, 'Product not found', 404);
        }
        const reviewRef = firebase_1.db.collection('reviews').doc();
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
        return (0, response_1.sendSuccess)(res, newReview, 'Review submitted successfully! It will be visible once approved.', 201);
    }
    catch (error) {
        console.error('Error submitting review:', error);
        return (0, response_1.sendError)(res, 'Failed to submit review', 500);
    }
});
// @route   GET /api/reviews/admin
// @desc    Get all reviews for moderation (Admin only)
// @access  Private/Admin
router.get('/admin', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, async (req, res) => {
    try {
        const snapshot = await firebase_1.db.collection('reviews').orderBy('createdAt', 'desc').get();
        const reviews = [];
        snapshot.forEach((doc) => {
            reviews.push(doc.data());
        });
        return (0, response_1.sendSuccess)(res, reviews, 'All reviews fetched successfully');
    }
    catch (error) {
        console.error('Error fetching admin reviews:', error);
        return (0, response_1.sendError)(res, 'Failed to fetch reviews', 500);
    }
});
// @route   PUT /api/reviews/admin/:id
// @desc    Moderate a review (approve, reject, feature) (Admin only)
// @access  Private/Admin
router.put('/admin/:id', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, [
    (0, express_validator_1.body)('approved').optional().isBoolean(),
    (0, express_validator_1.body)('featured').optional().isBoolean(),
], validation_middleware_1.validateRequest, async (req, res) => {
    try {
        const { id } = req.params;
        const reviewRef = firebase_1.db.collection('reviews').doc(id);
        const doc = await reviewRef.get();
        if (!doc.exists) {
            return (0, response_1.sendError)(res, 'Review not found', 404);
        }
        const { approved, featured } = req.body;
        const updateData = {};
        if (approved !== undefined)
            updateData.approved = approved;
        if (featured !== undefined)
            updateData.featured = featured;
        await reviewRef.update(updateData);
        // Recalculate product overall rating if approved state changed
        if (approved === true) {
            const reviewData = doc.data();
            const productId = reviewData.productId;
            const allReviewsSnapshot = await firebase_1.db
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
            await firebase_1.db.collection('products').doc(productId).update({
                rating: newAvg,
                reviewsCount: count,
            });
        }
        const updatedDoc = await reviewRef.get();
        return (0, response_1.sendSuccess)(res, updatedDoc.data(), 'Review status updated');
    }
    catch (error) {
        console.error('Error moderating review:', error);
        return (0, response_1.sendError)(res, 'Failed to update review status', 500);
    }
});
// @route   DELETE /api/reviews/admin/:id
// @desc    Delete a review (Admin only)
// @access  Private/Admin
router.delete('/admin/:id', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const reviewRef = firebase_1.db.collection('reviews').doc(id);
        const doc = await reviewRef.get();
        if (!doc.exists) {
            return (0, response_1.sendError)(res, 'Review not found', 404);
        }
        await reviewRef.delete();
        return (0, response_1.sendSuccess)(res, { id }, 'Review deleted successfully');
    }
    catch (error) {
        console.error('Error deleting review:', error);
        return (0, response_1.sendError)(res, 'Failed to delete review', 500);
    }
});
exports.default = router;
