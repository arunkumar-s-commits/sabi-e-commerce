import { Router, Request } from 'express';
import { body } from 'express-validator';
import { db } from '../config/firebase';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

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
    const cmsDoc = await db.collection('settings').doc('cms').get();
    if (!cmsDoc.exists) {
      console.log('Seeding default CMS settings...');
      await db.collection('settings').doc('cms').set(DEFAULT_CMS);
    }
    const bannerSnapshot = await db.collection('banners').limit(1).get();
    if (bannerSnapshot.empty) {
      console.log('Seeding default banners...');
      for (const banner of DEFAULT_BANNERS) {
        await db.collection('banners').doc(banner.id).set(banner);
      }
    }
  } catch (err) {
    console.error('Settings seeding error:', err);
  }
};

seedSettingsIfEmpty();

// @route   GET /api/settings/cms
// @desc    Get CMS static texts & FAQs
// @access  Public
router.get('/cms', async (req: Request, res: any) => {
  try {
    const doc = await db.collection('settings').doc('cms').get();
    if (!doc.exists) {
      return sendSuccess(res, DEFAULT_CMS, 'CMS settings fetched (defaults)');
    }
    return sendSuccess(res, doc.data(), 'CMS settings fetched successfully');
  } catch (error) {
    console.error('Error fetching CMS settings:', error);
    return sendError(res, 'Failed to fetch CMS settings', 500);
  }
});

// @route   PUT /api/settings/cms
// @desc    Update CMS content (Admin only)
// @access  Private/Admin
router.put('/cms', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: any) => {
  try {
    await db.collection('settings').doc('cms').set(req.body, { merge: true });
    const updated = await db.collection('settings').doc('cms').get();
    return sendSuccess(res, updated.data(), 'CMS settings updated successfully');
  } catch (error) {
    console.error('Error updating CMS settings:', error);
    return sendError(res, 'Failed to update CMS settings', 500);
  }
});

// @route   GET /api/settings/banners
// @desc    Get slider banners
// @access  Public
router.get('/banners', async (req: Request, res: any) => {
  try {
    const snapshot = await db.collection('banners').get();
    const banners: any[] = [];
    snapshot.forEach((doc) => {
      banners.push(doc.data());
    });
    return sendSuccess(res, banners, 'Banners fetched successfully');
  } catch (error) {
    console.error('Error fetching banners:', error);
    return sendError(res, 'Failed to fetch banners', 500);
  }
});

// @route   POST /api/settings/banners
// @desc    Add/Update a banner (Admin only)
// @access  Private/Admin
router.post('/banners', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { id, title, subtitle, imageUrl, link, type } = req.body;
    const bannerId = id || `banner_${Date.now()}`;
    const newBanner = { id: bannerId, title, subtitle, imageUrl, link, type: type || 'home_hero' };

    await db.collection('banners').doc(bannerId).set(newBanner);
    return sendSuccess(res, newBanner, 'Banner configured successfully');
  } catch (error) {
    console.error('Error setting banner:', error);
    return sendError(res, 'Failed to configure banner', 500);
  }
});

// @route   DELETE /api/settings/banners/:id
// @desc    Delete a banner (Admin only)
// @access  Private/Admin
router.delete('/banners/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { id } = req.params;
    await db.collection('banners').doc(id).delete();
    return sendSuccess(res, { id }, 'Banner removed successfully');
  } catch (error) {
    console.error('Error removing banner:', error);
    return sendError(res, 'Failed to remove banner', 500);
  }
});

export default router;
