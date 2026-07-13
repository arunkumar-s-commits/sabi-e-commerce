import { Router, Request } from 'express';
import { body } from 'express-validator';
import { supabase } from '../config/supabase';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { sendSuccess, sendError } from '../utils/response';

const router = Router();

// @route   GET /api/products
// @desc    Get all products with filters
// @access  Public
router.get('/', async (req: Request, res: any) => {
  try {
    const {
      category,
      occasion,
      minPrice,
      maxPrice,
      rating,
      tag,
      isPremium,
      isBestSeller,
      sort,
    } = req.query;

    let query = supabase.from('products').select('*');

    if (category) {
      query = query.eq('category', category);
    }
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice as string));
    }
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice as string));
    }
    if (rating) {
      query = query.gte('rating', parseFloat(rating as string));
    }
    if (isPremium !== undefined) {
      query = query.eq('isPremium', isPremium === 'true');
    }
    if (isBestSeller !== undefined) {
      query = query.eq('isBestSeller', isBestSeller === 'true');
    }
    
    // Arrays overlap for occasion and tag
    if (occasion) {
      query = query.contains('occasions', [occasion]);
    }
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    // Sort options
    if (sort) {
      if (sort === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (sort === 'price_desc') {
        query = query.order('price', { ascending: false });
      } else if (sort === 'rating') {
        query = query.order('rating', { ascending: false });
      } else if (sort === 'newest') {
        query = query.order('createdAt', { ascending: false });
      }
    } else {
      // default sort
      query = query.order('createdAt', { ascending: false });
    }

    const { data: products, error } = await query;

    if (error) throw error;

    return sendSuccess(res, products, 'Products fetched successfully');
  } catch (error) {
    console.error('Error fetching products:', error);
    return sendError(res, 'Failed to fetch products', 500);
  }
});

// @route   GET /api/products/search
// @desc    Search and auto-complete suggestions
// @access  Public
router.get('/search', async (req: Request, res: any) => {
  try {
    const searchQuery = (req.query.q as string || '').toLowerCase().trim();
    if (!searchQuery) {
      return sendSuccess(res, [], 'Search query is empty');
    }

    // using ilike for case-insensitive search
    const { data: products, error } = await supabase
      .from('products')
      .select('id, title, category, price, images')
      .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`)
      .limit(10);

    if (error) throw error;

    const suggestions = products.map((data: any) => ({
      id: data.id,
      title: data.title,
      category: data.category,
      price: data.price,
      image: data.images && data.images.length > 0 ? data.images[0] : '',
    }));

    return sendSuccess(res, suggestions, 'Search completed successfully');
  } catch (error) {
    console.error('Search query failed:', error);
    return sendError(res, 'Search suggestion failed', 500);
  }
});

// @route   GET /api/products/:id
// @desc    Get single product details
// @access  Public
router.get('/:id', async (req: Request, res: any) => {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return sendError(res, 'Product not found', 404);
      }
      throw error;
    }

    return sendSuccess(res, product, 'Product details fetched');
  } catch (error) {
    console.error('Error fetching product detail:', error);
    return sendError(res, 'Failed to fetch product details', 500);
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private/Admin
router.post(
  '/',
  requireAuth,
  requireAdmin,
  [
    body('title').notEmpty().withMessage('Product title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('category').notEmpty().withMessage('Category selection is required'),
    body('stock').isNumeric().withMessage('Stock must be a number'),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const newProduct = {
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        compareAtPrice: req.body.compareAtPrice || null,
        category: req.body.category,
        stock: req.body.stock,
        rating: req.body.rating || 5.0,
        reviewsCount: 0,
        images: req.body.images || [],
        specifications: req.body.specifications || [],
        faqs: req.body.faqs || [],
        variants: req.body.variants || [],
        occasions: req.body.occasions || [],
        tags: req.body.tags || [],
        isPremium: req.body.isPremium || false,
        isBestSeller: req.body.isBestSeller || false,
      };

      const { data, error } = await supabase
        .from('products')
        .insert([newProduct])
        .select()
        .single();

      if (error) throw error;

      return sendSuccess(res, data, 'Product created successfully', 201);
    } catch (error) {
      console.error('Error creating product:', error);
      return sendError(res, 'Failed to create product', 500);
    }
  }
);

// @route   PUT /api/products/:id
// @desc    Edit a product
// @access  Private/Admin
router.put(
  '/:id',
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const updateData = { ...req.body };
      
      // Ensure id cannot be changed
      delete updateData.id;
      delete updateData.createdAt;

      updateData.updatedAt = new Date().toISOString();

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return sendError(res, 'Product not found', 404);
        }
        throw error;
      }

      return sendSuccess(res, data, 'Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      return sendError(res, 'Failed to update product', 500);
    }
  }
);

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private/Admin
router.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res: any) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', req.params.id);

      if (error) {
        throw error;
      }

      return sendSuccess(res, { id: req.params.id }, 'Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      return sendError(res, 'Failed to delete product', 500);
    }
  }
);

export default router;
