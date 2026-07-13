import { Router, Request } from 'express';
import { body } from 'express-validator';
import { db } from '../config/firebase';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// @route   POST /api/leads/wedding
// @desc    Submit a wedding return gift inquiry
// @access  Public
router.post(
  '/wedding',
  [
    body('name').notEmpty().withMessage('Contact name is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('eventDate').notEmpty().withMessage('Event date is required'),
    body('quantity').isInt({ min: 10 }).withMessage('Minimum order quantity is 10 pieces'),
    body('budget').isNumeric().withMessage('Estimated budget is required'),
    body('productPreference').optional().isString(),
  ],
  validateRequest,
  async (req: Request, res: any) => {
    try {
      const { name, phone, email, eventDate, quantity, budget, productPreference } = req.body;
      
      const leadRef = db.collection('weddingLeads').doc();
      const newLead = {
        id: leadRef.id,
        name,
        phone,
        email: email || '',
        eventDate,
        quantity: Number(quantity),
        budget: Number(budget),
        productPreference: productPreference || '',
        status: 'new',
        notes: '',
        createdAt: new Date().toISOString(),
      };

      await leadRef.set(newLead);
      return sendSuccess(res, newLead, 'Wedding inquiry submitted successfully! Our expert will call you within 24 hours.', 201);
    } catch (error) {
      console.error('Error submitting wedding lead:', error);
      return sendError(res, 'Failed to submit wedding inquiry', 500);
    }
  }
);

// @route   POST /api/leads/corporate
// @desc    Submit a corporate gifting inquiry
// @access  Public
router.post(
  '/corporate',
  [
    body('companyName').notEmpty().withMessage('Company name is required'),
    body('contactPerson').notEmpty().withMessage('Contact person name is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('quantity').isInt({ min: 5 }).withMessage('Minimum order quantity is 5 sets'),
    body('budget').isNumeric().withMessage('Estimated budget is required'),
    body('requirements').notEmpty().withMessage('Gifting requirements are required'),
  ],
  validateRequest,
  async (req: Request, res: any) => {
    try {
      const { companyName, contactPerson, phone, email, gstNumber, quantity, budget, requirements } = req.body;

      const leadRef = db.collection('corporateLeads').doc();
      const newLead = {
        id: leadRef.id,
        companyName,
        contactPerson,
        phone,
        email: email || '',
        gstNumber: gstNumber || '',
        quantity: Number(quantity),
        budget: Number(budget),
        requirements,
        status: 'new',
        notes: '',
        createdAt: new Date().toISOString(),
      };

      await leadRef.set(newLead);
      return sendSuccess(res, newLead, 'Corporate inquiry submitted successfully! Our manager will email a customized catalog.', 201);
    } catch (error) {
      console.error('Error submitting corporate lead:', error);
      return sendError(res, 'Failed to submit corporate inquiry', 500);
    }
  }
);

// @route   GET /api/leads/admin/all
// @desc    Get all leads from both categories (Admin only)
// @access  Private/Admin
router.get('/admin/all', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: any) => {
  try {
    const weddingSnapshot = await db.collection('weddingLeads').orderBy('createdAt', 'desc').get();
    const corporateSnapshot = await db.collection('corporateLeads').orderBy('createdAt', 'desc').get();

    const weddingLeads: any[] = [];
    const corporateLeads: any[] = [];

    weddingSnapshot.forEach((doc) => {
      weddingLeads.push({ ...doc.data(), type: 'wedding' });
    });

    corporateSnapshot.forEach((doc) => {
      corporateLeads.push({ ...doc.data(), type: 'corporate' });
    });

    // Combine and sort by date
    const allLeads = [...weddingLeads, ...corporateLeads].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sendSuccess(res, allLeads, 'All leads fetched successfully');
  } catch (error) {
    console.error('Error fetching leads for admin:', error);
    return sendError(res, 'Failed to fetch leads', 500);
  }
});

// @route   PUT /api/leads/admin/:type/:id
// @desc    Update lead status / notes (Admin only)
// @access  Private/Admin
router.put(
  '/admin/:type/:id',
  requireAuth,
  requireAdmin,
  [
    body('status').isIn(['new', 'contacted', 'quoted', 'converted', 'lost']).withMessage('Invalid status'),
    body('notes').optional().isString(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { type, id } = req.params;
      const collectionName = type === 'wedding' ? 'weddingLeads' : 'corporateLeads';
      
      const leadRef = db.collection(collectionName).doc(id);
      const doc = await leadRef.get();

      if (!doc.exists) {
        return sendError(res, 'Lead not found', 404);
      }

      const { status, notes } = req.body;
      const updateData: any = { status };
      if (notes !== undefined) {
        updateData.notes = notes;
      }

      await leadRef.update(updateData);
      const updatedDoc = await leadRef.get();

      return sendSuccess(res, { ...updatedDoc.data(), type }, 'Lead status updated');
    } catch (error) {
      console.error('Error updating lead status:', error);
      return sendError(res, 'Failed to update lead status', 500);
    }
  }
);

export default router;
