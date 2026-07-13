import { Router, Request } from 'express';
import { body } from 'express-validator';
import { supabase } from '../config/supabase';
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
      
      const newLead = {
        name,
        phone,
        email: email || '',
        requirements: `Event Date: ${eventDate}\nProduct Preference: ${productPreference || 'None'}\nQuantity: ${quantity}`,
        budget: String(budget),
        status: 'new',
        type: 'wedding',
        notes: '',
      };

      const { data, error } = await supabase.from('leads').insert([newLead]).select().single();
      if (error) throw error;

      return sendSuccess(res, data, 'Wedding inquiry submitted successfully! Our expert will call you within 24 hours.', 201);
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

      const newLead = {
        name: contactPerson,
        phone,
        email: email || '',
        company: companyName,
        requirements: `GST: ${gstNumber || 'None'}\nQuantity: ${quantity}\nRequirements: ${requirements}`,
        budget: String(budget),
        status: 'new',
        type: 'corporate',
        notes: '',
      };

      const { data, error } = await supabase.from('leads').insert([newLead]).select().single();
      if (error) throw error;

      return sendSuccess(res, data, 'Corporate inquiry submitted successfully! Our manager will email a customized catalog.', 201);
    } catch (error) {
      console.error('Error submitting corporate lead:', error);
      return sendError(res, 'Failed to submit corporate inquiry', 500);
    }
  }
);

// @route   GET /api/leads/admin/all
// @desc    Get all leads (Admin only)
// @access  Private/Admin
router.get('/admin/all', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { data: allLeads, error } = await supabase
      .from('leads')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;

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
      const { id } = req.params; // type is no longer needed since it's merged
      
      const { data: doc } = await supabase.from('leads').select('id').eq('id', id).single();

      if (!doc) {
        return sendError(res, 'Lead not found', 404);
      }

      const { status, notes } = req.body;
      const updateData: any = { status, updatedAt: new Date().toISOString() };
      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const { data: updatedDoc, error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;

      return sendSuccess(res, updatedDoc, 'Lead status updated');
    } catch (error) {
      console.error('Error updating lead status:', error);
      return sendError(res, 'Failed to update lead status', 500);
    }
  }
);

export default router;
