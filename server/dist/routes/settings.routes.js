"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const firebase_1 = require("../config/firebase");
const auth_middleware_1 = require("../middleware/auth.middleware");
const response_1 = require("../utils/response");
const router = (0, express_1.Router)();
const DEFAULT_CMS = {
    aboutUs: 'Sabi Return Gifts is India’s premier destination for luxury return gifts. We specialize in curating traditional and modern wedding collections, personalized favors, corporate kits, and festive hampers that are designed to convey gratitude and elevate celebrations.',
    contactEmail: 'support@sabireturngifts.com',
    contactPhone: '+91 98765 43210',
    address: '102, Gold Crest Plaza, Jubilee Hills, Hyderabad, TS, India',
    faqs: [
        { question: 'What is the minimum order quantity (MOQ)?', answer: 'For retail standard items, there is no MOQ. For customized bags and corporate combos, the MOQ is 10-25 items depending on the customization requested.' },
        { question: 'Do you deliver PAN India?', answer: 'Yes! We ship across all Indian states and pin codes. Standard delivery takes 5-7 business days, and express options are available.' },
        { question: 'Can we add personalized tags?', answer: 'Absolutely. We offer complimentary printed gold-foil greeting cards and personalized names/dates cards for orders over 50 pieces.' }
    ],
    terms: 'All purchases are subject to availability. Prices are inclusive of GST. Custom orders cannot be returned once production starts.',
    refundPolicy: 'Returns are accepted within 7 days of delivery for non-customized products only if they arrive damaged. Replacement will be processed upon inspection.',
    privacyPolicy: 'We respect your privacy. User personal data is only utilized for order fulfillment and payment verification via Razorpay security standards.'
};
const DEFAULT_BANNERS = [
    {
        id: 'b1',
        title: 'Elegant Return Gifts For Grand Celebrations',
        subtitle: 'Handcrafted bags, brass accessories, and personalized gift hampers.',
        imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1200&auto=format&fit=crop',
        link: '/shop',
        type: 'home_hero'
    },
    {
        id: 'b2',
        title: 'Royal Wedding Collections',
        subtitle: 'Tambulam bags, mehendi sets, and premium bridal kits with gold accents.',
        imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1200&auto=format&fit=crop',
        link: '/shop?category=wedding-essentials',
        type: 'home_hero'
    }
];
// Seed settings & banners
const seedSettingsIfEmpty = async () => {
    try {
        const cmsDoc = await firebase_1.db.collection('settings').doc('cms').get();
        if (!cmsDoc.exists) {
            console.log('Seeding default CMS settings...');
            await firebase_1.db.collection('settings').doc('cms').set(DEFAULT_CMS);
        }
        const bannerSnapshot = await firebase_1.db.collection('banners').limit(1).get();
        if (bannerSnapshot.empty) {
            console.log('Seeding default banners...');
            for (const banner of DEFAULT_BANNERS) {
                await firebase_1.db.collection('banners').doc(banner.id).set(banner);
            }
        }
    }
    catch (err) {
        console.error('Settings seeding error:', err);
    }
};
seedSettingsIfEmpty();
// @route   GET /api/settings/cms
// @desc    Get CMS static texts & FAQs
// @access  Public
router.get('/cms', async (req, res) => {
    try {
        const doc = await firebase_1.db.collection('settings').doc('cms').get();
        if (!doc.exists) {
            return (0, response_1.sendSuccess)(res, DEFAULT_CMS, 'CMS settings fetched (defaults)');
        }
        return (0, response_1.sendSuccess)(res, doc.data(), 'CMS settings fetched successfully');
    }
    catch (error) {
        console.error('Error fetching CMS settings:', error);
        return (0, response_1.sendError)(res, 'Failed to fetch CMS settings', 500);
    }
});
// @route   PUT /api/settings/cms
// @desc    Update CMS content (Admin only)
// @access  Private/Admin
router.put('/cms', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, async (req, res) => {
    try {
        await firebase_1.db.collection('settings').doc('cms').set(req.body, { merge: true });
        const updated = await firebase_1.db.collection('settings').doc('cms').get();
        return (0, response_1.sendSuccess)(res, updated.data(), 'CMS settings updated successfully');
    }
    catch (error) {
        console.error('Error updating CMS settings:', error);
        return (0, response_1.sendError)(res, 'Failed to update CMS settings', 500);
    }
});
// @route   GET /api/settings/banners
// @desc    Get slider banners
// @access  Public
router.get('/banners', async (req, res) => {
    try {
        const snapshot = await firebase_1.db.collection('banners').get();
        const banners = [];
        snapshot.forEach((doc) => {
            banners.push(doc.data());
        });
        return (0, response_1.sendSuccess)(res, banners, 'Banners fetched successfully');
    }
    catch (error) {
        console.error('Error fetching banners:', error);
        return (0, response_1.sendError)(res, 'Failed to fetch banners', 500);
    }
});
// @route   POST /api/settings/banners
// @desc    Add/Update a banner (Admin only)
// @access  Private/Admin
router.post('/banners', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, async (req, res) => {
    try {
        const { id, title, subtitle, imageUrl, link, type } = req.body;
        const bannerId = id || `banner_${Date.now()}`;
        const newBanner = { id: bannerId, title, subtitle, imageUrl, link, type: type || 'home_hero' };
        await firebase_1.db.collection('banners').doc(bannerId).set(newBanner);
        return (0, response_1.sendSuccess)(res, newBanner, 'Banner configured successfully');
    }
    catch (error) {
        console.error('Error setting banner:', error);
        return (0, response_1.sendError)(res, 'Failed to configure banner', 500);
    }
});
// @route   DELETE /api/settings/banners/:id
// @desc    Delete a banner (Admin only)
// @access  Private/Admin
router.delete('/banners/:id', auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await firebase_1.db.collection('banners').doc(id).delete();
        return (0, response_1.sendSuccess)(res, { id }, 'Banner removed successfully');
    }
    catch (error) {
        console.error('Error removing banner:', error);
        return (0, response_1.sendError)(res, 'Failed to remove banner', 500);
    }
});
exports.default = router;
