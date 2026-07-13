"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const firebase_1 = require("../config/firebase");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validation_middleware_1 = require("../middleware/validation.middleware");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
const SEED_CATEGORIES = [
    {
        name: 'Return Gifts',
        slug: 'return-gifts',
        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop',
        featuredProduct: '',
        quickLinks: [
            { label: 'By Occasion', href: '/shop?category=return-gifts' },
            { label: 'By Budget', href: '/shop?category=return-gifts&sort=price_asc' },
            { label: 'Best Sellers', href: '/shop?category=return-gifts&tag=Best+Seller' }
        ]
    },
    {
        name: 'Wedding Essentials',
        slug: 'wedding-essentials',
        image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=600&auto=format&fit=crop',
        featuredProduct: '',
        quickLinks: [
            { label: 'Tambulam Bags', href: '/shop?category=wedding-essentials&tag=Tambulam+Bags' },
            { label: 'Bridal Hampers', href: '/shop?category=wedding-essentials&tag=Bridal+Hampers' },
            { label: 'Mehendi Gifts', href: '/shop?category=wedding-essentials&tag=Mehendi+Gifts' }
        ]
    },
    {
        name: 'Corporate Gifts',
        slug: 'corporate-gifts',
        image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=600&auto=format&fit=crop',
        featuredProduct: '',
        quickLinks: [
            { label: 'Employee Kits', href: '/shop?category=corporate-gifts&tag=Employee+Kits' },
            { label: 'Office Essentials', href: '/shop?category=corporate-gifts&tag=Office' },
            { label: 'Bulk Orders', href: '/bulk-order' }
        ]
    },
    {
        name: 'Personalized Gifts',
        slug: 'personalized-gifts',
        image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=600&auto=format&fit=crop',
        featuredProduct: '',
        quickLinks: [
            { label: 'Photo Gifts', href: '/shop?category=personalized-gifts' },
            { label: 'Custom Engraved', href: '/shop?category=personalized-gifts' }
        ]
    },
    {
        name: 'Hampers',
        slug: 'hampers',
        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop',
        featuredProduct: '',
        quickLinks: [
            { label: 'Gourmet Hampers', href: '/shop?category=hampers' },
            { label: 'Luxury Hampers', href: '/shop?category=hampers&isPremium=true' }
        ]
    },
    {
        name: 'Combo Packs',
        slug: 'combo-packs',
        image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=600&auto=format&fit=crop',
        featuredProduct: '',
        quickLinks: [
            { label: 'Wedding Combos', href: '/shop?category=combo-packs' },
            { label: 'Festive Combos', href: '/shop?category=combo-packs' }
        ]
    }
];
// Seed logic
const seedCategoriesIfEmpty = async () => {
    try {
        const snap = await firebase_1.db.collection('categories').limit(1).get();
        if (snap.empty) {
            console.log('Seeding categories...');
            const batch = firebase_1.db.batch();
            for (const cat of SEED_CATEGORIES) {
                const docRef = firebase_1.db.collection('categories').doc(cat.slug);
                batch.set(docRef, cat);
            }
            await batch.commit();
            console.log('Seeding categories completed.');
        }
    }
    catch (err) {
        console.error('Error seeding categories:', err);
    }
};
seedCategoriesIfEmpty();
// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
    try {
        const snapshot = await firebase_1.db.collection('categories').get();
        const categories = [];
        snapshot.forEach((doc) => {
            categories.push(doc.data());
        });
        return (0, response_1.sendSuccess)(res, categories, 'Categories fetched successfully');
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        return (0, response_1.sendError)(res, 'Failed to fetch categories', 500);
    }
});
// @route   POST /api/categories
// @desc    Create new category
// @access  Private/Admin
router.post('/', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Category name is required'),
    (0, express_validator_1.body)('slug').notEmpty().withMessage('Category slug is required'),
], validation_middleware_1.validateRequest, async (req, res) => {
    try {
        const { name, slug, image, featuredProduct, quickLinks } = req.body;
        const docRef = firebase_1.db.collection('categories').doc(slug);
        const doc = await docRef.get();
        if (doc.exists) {
            return (0, response_1.sendError)(res, 'Category with this slug already exists', 400);
        }
        const newCategory = {
            name,
            slug,
            image: image || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop',
            featuredProduct: featuredProduct || '',
            quickLinks: quickLinks || [],
        };
        await docRef.set(newCategory);
        return (0, response_1.sendSuccess)(res, newCategory, 'Category created successfully', 201);
    }
    catch (error) {
        console.error('Error creating category:', error);
        return (0, response_1.sendError)(res, 'Failed to create category', 500);
    }
});
// @route   DELETE /api/categories/:slug
// @desc    Delete a category
// @access  Private/Admin
router.delete('/:slug', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, async (req, res) => {
    try {
        const docRef = firebase_1.db.collection('categories').doc(req.params.slug);
        const doc = await docRef.get();
        if (!doc.exists) {
            return (0, response_1.sendError)(res, 'Category not found', 404);
        }
        await docRef.delete();
        return (0, response_1.sendSuccess)(res, { slug: req.params.slug }, 'Category deleted successfully');
    }
    catch (error) {
        console.error('Error deleting category:', error);
        return (0, response_1.sendError)(res, 'Failed to delete category', 500);
    }
});
exports.default = router;
