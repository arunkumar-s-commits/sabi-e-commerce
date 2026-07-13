import { Router, Request } from 'express';
import { supabase } from '../config/supabase';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// @route   GET /api/settings/cms
// @desc    Get CMS static texts & FAQs
// @access  Public
router.get('/cms', async (req: Request, res: any) => {
  try {
    const { data: doc, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'cms')
        .single();
        
    if (error || !doc) {
      // In a real app we'd want a default object to return if none is set
      return sendError(res, 'CMS settings not found', 404);
    }
    return sendSuccess(res, doc, 'CMS settings fetched successfully');
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
    // Check if exists
    const { data: existing } = await supabase.from('settings').select('id').eq('id', 'cms').single();
    
    if (existing) {
      await supabase.from('settings').update(req.body).eq('id', 'cms');
    } else {
      await supabase.from('settings').insert([{ id: 'cms', ...req.body }]);
    }
    
    const { data: updated } = await supabase.from('settings').select('*').eq('id', 'cms').single();
    return sendSuccess(res, updated, 'CMS settings updated successfully');
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
    const { data: banners, error } = await supabase.from('banners').select('*');
    if (error) throw error;
    
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

    const { data: existing } = await supabase.from('banners').select('id').eq('id', bannerId).single();
    
    if (existing) {
        await supabase.from('banners').update(newBanner).eq('id', bannerId);
    } else {
        await supabase.from('banners').insert([newBanner]);
    }
    
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
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) throw error;
    
    return sendSuccess(res, { id }, 'Banner removed successfully');
  } catch (error) {
    console.error('Error removing banner:', error);
    return sendError(res, 'Failed to remove banner', 500);
  }
});

export default router;
