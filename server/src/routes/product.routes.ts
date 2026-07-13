import { Router, Request } from 'express';
import { body } from 'express-validator';
import { db } from '../config/firebase';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { sendSuccess, sendError } from '../utils/response';
import { uploadImage } from '../config/cloudinary';

const router = Router();

// Sample Luxury Gifting Products Seed Data
const LUXURY_SEED_PRODUCTS = [
  {
    title: 'Venezia Silk Tambulam Bag',
    description: 'Exquisitely crafted Venezia silk bag featuring premium zari borders and double handles. Perfect for weddings, baby showers, and traditional festivities.',
    price: 149,
    compareAtPrice: 199,
    images: ['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop'],
    videoUrl: '',
    category: 'wedding-essentials',
    occasions: ['Wedding', 'Festival', 'Baby Shower'],
    tags: ['Best Seller', 'Tambulam Bags'],
    variants: [
      { id: 'v1', size: 'Medium', material: 'Venezia Silk', color: 'Royal Red', price: 149, stock: 120 },
      { id: 'v2', size: 'Medium', material: 'Venezia Silk', color: 'Gold Mustard', price: 149, stock: 95 }
    ],
    stock: 215,
    rating: 4.8,
    reviewsCount: 38,
    isPremium: false,
    isBestSeller: true,
    specifications: [
      { key: 'Material', value: 'Raw Venezia Silk with Zari' },
      { key: 'Size', value: '8 x 6 inches' },
      { key: 'Closure', value: 'Drawstring / Potli style' }
    ],
    faqs: [
      { question: 'Can we order custom colors?', answer: 'Yes, for orders above 100 pieces, custom color options are available.' },
      { question: 'Is the lining durable?', answer: 'Yes, we use 70GSM taffeta lining for premium strength.' }
    ]
  },
  {
    title: 'Heritage Brass Kumkum Box Gift Set',
    description: 'Handcrafted pure brass minakari box featuring double compartments for Kumkum and Turmeric. Packaged in a gold-foil rigid box.',
    price: 349,
    compareAtPrice: 499,
    images: ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=600&auto=format&fit=crop'],
    category: 'return-gifts',
    occasions: ['Wedding', 'Housewarming', 'Festival'],
    tags: ['Best Seller', 'Home Decor'],
    variants: [
      { id: 'k1', size: 'Standard', material: 'Brass', color: 'Gold Minakari', price: 349, stock: 50 }
    ],
    stock: 50,
    rating: 4.9,
    reviewsCount: 15,
    isPremium: true,
    isBestSeller: true,
    specifications: [
      { key: 'Material', value: 'Solid Brass & Enamel Paint' },
      { key: 'Weight', value: '180 grams' }
    ],
    faqs: [
      { question: 'Does it tarnish over time?', answer: 'It is coated with clear lacquer to maintain its shine for years. Clean with dry cloth.' }
    ]
  },
  {
    title: 'Royal Mughal Wooden Dry Fruit Box',
    description: 'A luxurious wooden chest box with brass embossing, filled with premium selected dry fruits. A classic gift for weddings and high-end corporate events.',
    price: 899,
    compareAtPrice: 1200,
    images: ['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop'],
    category: 'hampers',
    occasions: ['Corporate Event', 'Wedding', 'Festival'],
    tags: ['Hampers', 'Premium Gifting'],
    variants: [
      { id: 'db1', size: '4 Slots', material: 'Teak Wood & Brass', color: 'Antique Brown', price: 899, stock: 80 }
    ],
    stock: 80,
    rating: 4.7,
    reviewsCount: 42,
    isPremium: true,
    isBestSeller: false,
    specifications: [
      { key: 'Wood Type', value: 'Teak wood structure' },
      { key: 'Dimensions', value: '10 x 10 x 3 inches' }
    ],
    faqs: [
      { question: 'Are the dry fruits fresh?', answer: 'We pack dry fruits on the day of dispatch in sealed vacuum pouches.' }
    ]
  },
  {
    title: 'The Executive Leather Desk Kit',
    description: 'Vegan leather desk organizer bundle featuring a personalized notebook, gold metal pen, cardholder, and thermal coffee tumbler.',
    price: 1499,
    compareAtPrice: 2000,
    images: ['https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=600&auto=format&fit=crop'],
    category: 'corporate-gifts',
    occasions: ['Corporate Event'],
    tags: ['Employee Kits', 'Corporate Gifts'],
    variants: [
      { id: 'l1', size: 'Full Kit', material: 'Vegan Leather & Steel', color: 'Midnight Black', price: 1499, stock: 200 },
      { id: 'l2', size: 'Full Kit', material: 'Vegan Leather & Steel', color: 'Tan Brown', price: 1499, stock: 150 }
    ],
    stock: 350,
    rating: 4.6,
    reviewsCount: 29,
    isPremium: true,
    isBestSeller: false,
    specifications: [
      { key: 'Tumbler Capacity', value: '450 ml' },
      { key: 'Diary Type', value: 'A5 Notebook, Ruled, 80GSM' }
    ],
    faqs: [
      { question: 'Can we add our company logo?', answer: 'Yes, custom logo embossing is complimentary on orders of 25+ sets.' }
    ]
  },
  {
    title: 'Sandalwood Fragrance Potpourri Hamper',
    description: 'An elegant glass jar containing premium sandalwood potpourri, scented soy wax candle, and a brass wick trimmer. Adorned with gold lace ribbons.',
    price: 499,
    compareAtPrice: 650,
    images: ['https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=600&auto=format&fit=crop'],
    category: 'personalized-gifts',
    occasions: ['Housewarming', 'Birthday', 'Festival'],
    tags: ['Personalized Gifts', 'Hampers'],
    variants: [
      { id: 'sh1', size: 'Standard', material: 'Glass & Soy Wax', color: 'Gold Sandalwood', price: 499, stock: 75 }
    ],
    stock: 75,
    rating: 4.5,
    reviewsCount: 11,
    isPremium: false,
    isBestSeller: false,
    specifications: [
      { key: 'Burn Time', value: '30 hours' },
      { key: 'Fragrance', value: 'Sandalwood & Jasmine' }
    ],
    faqs: [
      { question: 'Is it soot-free?', answer: 'Yes, we use 100% natural soy wax with cotton wicks for clean burning.' }
    ]
  }
];

// Helper: Seed initial products if DB empty
const seedProductsIfEmpty = async () => {
  try {
    const productsSnapshot = await db.collection('products').limit(1).get();
    if (productsSnapshot.empty) {
      console.log('Seeding initial luxury products into database...');
      const batch = db.batch();
      for (const prod of LUXURY_SEED_PRODUCTS) {
        const docRef = db.collection('products').doc();
        batch.set(docRef, {
          ...prod,
          id: docRef.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      await batch.commit();
      console.log('Successfully seeded database with luxury products.');
    }
  } catch (err) {
    console.error('Error seeding products:', err);
  }
};

// Seed trigger
seedProductsIfEmpty();

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

    let queryRef: FirebaseFirestore.Query = db.collection('products');

    // Filter by fields (Firestore only supports simple query chaining, complex filtering done post-fetch to avoid composite index limits)
    if (category) {
      queryRef = queryRef.where('category', '==', category);
    }
    
    const snapshot = await queryRef.get();
    let products: any[] = [];
    snapshot.forEach((doc) => {
      products.push(doc.data());
    });

    // Post-processing filter logic to avoid indexing errors
    if (occasion) {
      products = products.filter((p) => p.occasions && p.occasions.includes(occasion));
    }
    if (tag) {
      products = products.filter((p) => p.tags && p.tags.includes(tag));
    }
    if (minPrice) {
      products = products.filter((p) => p.price >= parseFloat(minPrice as string));
    }
    if (maxPrice) {
      products = products.filter((p) => p.price <= parseFloat(maxPrice as string));
    }
    if (rating) {
      products = products.filter((p) => p.rating >= parseFloat(rating as string));
    }
    if (isPremium !== undefined) {
      const premVal = isPremium === 'true';
      products = products.filter((p) => p.isPremium === premVal);
    }
    if (isBestSeller !== undefined) {
      const bestVal = isBestSeller === 'true';
      products = products.filter((p) => p.isBestSeller === bestVal);
    }

    // Sort options
    if (sort) {
      if (sort === 'price_asc') {
        products.sort((a, b) => a.price - b.price);
      } else if (sort === 'price_desc') {
        products.sort((a, b) => b.price - a.price);
      } else if (sort === 'rating') {
        products.sort((a, b) => b.rating - a.rating);
      } else if (sort === 'newest') {
        products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    }

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
    const query = (req.query.q as string || '').toLowerCase().trim();
    if (!query) {
      return sendSuccess(res, [], 'Search query is empty');
    }

    const snapshot = await db.collection('products').get();
    const suggestions: any[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const title = data.title.toLowerCase();
      const desc = data.description.toLowerCase();
      const cat = data.category.toLowerCase();
      
      if (title.includes(query) || desc.includes(query) || cat.includes(query)) {
        suggestions.push({
          id: data.id,
          title: data.title,
          category: data.category,
          price: data.price,
          image: data.images[0] || '',
        });
      }
    });

    return sendSuccess(res, suggestions.slice(0, 10), 'Search completed successfully');
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
    const productRef = db.collection('products').doc(req.params.id);
    const doc = await productRef.get();

    if (!doc.exists) {
      return sendError(res, 'Product not found', 404);
    }

    return sendSuccess(res, doc.data(), 'Product details fetched');
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
      const productRef = db.collection('products').doc();
      const newProduct = {
        ...req.body,
        id: productRef.id,
        rating: req.body.rating || 5.0,
        reviewsCount: 0,
        images: req.body.images || [],
        specifications: req.body.specifications || [],
        faqs: req.body.faqs || [],
        variants: req.body.variants || [],
        occasions: req.body.occasions || [],
        tags: req.body.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await productRef.set(newProduct);
      return sendSuccess(res, newProduct, 'Product created successfully', 201);
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
      const productRef = db.collection('products').doc(req.params.id);
      const doc = await productRef.get();

      if (!doc.exists) {
        return sendError(res, 'Product not found', 404);
      }

      const updateData = {
        ...req.body,
        updatedAt: new Date().toISOString(),
      };

      // Ensure id cannot be changed
      delete updateData.id;
      delete updateData.createdAt;

      await productRef.update(updateData);
      
      const updatedDoc = await productRef.get();
      return sendSuccess(res, updatedDoc.data(), 'Product updated successfully');
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
      const productRef = db.collection('products').doc(req.params.id);
      const doc = await productRef.get();

      if (!doc.exists) {
        return sendError(res, 'Product not found', 404);
      }

      await productRef.delete();
      return sendSuccess(res, { id: req.params.id }, 'Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      return sendError(res, 'Failed to delete product', 500);
    }
  }
);

export default router;
