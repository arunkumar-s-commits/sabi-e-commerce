import { Router, Request } from 'express';
import { body } from 'express-validator';
import { supabase } from '../config/supabase';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req: Request, res: any) => {
  try {
    const { data: categories, error } = await supabase.from('categories').select('*');
    
    if (error) throw error;
    
    return sendSuccess(res, categories, 'Categories fetched successfully');
  } catch (error) {
    console.error('Error fetching categories:', error);
    return sendError(res, 'Failed to fetch categories', 500);
  }
});

// @route   POST /api/categories
// @desc    Create new category
// @access  Private/Admin
router.post(
  '/',
  requireAuth,
  requireAdmin,
  [
    body('name').notEmpty().withMessage('Category name is required'),
    body('slug').notEmpty().withMessage('Category slug is required'),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { name, slug, image, featuredProduct, quickLinks } = req.body;
      
      const { data: existing, error: checkError } = await supabase
        .from('categories')
        .select('slug')
        .eq('slug', slug)
        .single();

      if (existing) {
        return sendError(res, 'Category with this slug already exists', 400);
      }

      const newCategory = {
        name,
        slug,
        image: image || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop',
        featuredProduct: featuredProduct || '',
        quickLinks: quickLinks || [],
      };

      const { data, error } = await supabase
        .from('categories')
        .insert([newCategory])
        .select()
        .single();

      if (error) throw error;

      return sendSuccess(res, data, 'Category created successfully', 201);
    } catch (error) {
      console.error('Error creating category:', error);
      return sendError(res, 'Failed to create category', 500);
    }
  }
);

// @route   DELETE /api/categories/:slug
// @desc    Delete a category
// @access  Private/Admin
router.delete('/:slug', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: any) => {
  try {
    const { data: existing, error: checkError } = await supabase
        .from('categories')
        .select('slug')
        .eq('slug', req.params.slug)
        .single();

    if (!existing) {
      return sendError(res, 'Category not found', 404);
    }

    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('slug', req.params.slug);
        
    if (error) throw error;

    return sendSuccess(res, { slug: req.params.slug }, 'Category deleted successfully');
  } catch (error) {
    console.error('Error deleting category:', error);
    return sendError(res, 'Failed to delete category', 500);
  }
});

export default router;
