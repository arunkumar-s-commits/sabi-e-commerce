import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { ProductCard, ProductProps } from '../components/shop/ProductCard';
import { ArrowRight, Sparkles, Gift, ShieldCheck, Heart, ShoppingBag, Percent } from 'lucide-react';
import { useAppDispatch } from '../store';
import { addToCart } from '../store/slices/cartSlice';
import { showToast } from '../store/slices/uiSlice';

// Hero slides images
const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1200&auto=format&fit=crop',
    title: 'Elegant Gifts For Every Occasion',
    subtitle: 'Discover premium return gifts, wedding collections, personalized hampers, and corporate gifting solutions crafted to create unforgettable memories.'
  }
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [products, setProducts] = useState<ProductProps[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Budget Tab Filter State
  const [selectedBudgetTab, setSelectedBudgetTab] = useState<number>(299); // Defaults to under 299

  // Combo Builder State
  const [comboBags, setComboBags] = useState(true);
  const [comboBrass, setComboBrass] = useState(true);
  const [comboCard, setComboCard] = useState(false);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const prodRes = await apiRequest('/products');
        const catRes = await apiRequest('/categories');
        
        if (prodRes.success) setProducts(prodRes.data);
        if (catRes.success) setCategories(catRes.data);
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  // Filter products by budget category limit
  const budgetFilteredProducts = products.filter((p) => p.price <= selectedBudgetTab);
  
  // Best Sellers filter
  const bestSellers = products.filter((p) => p.isBestSeller);

  // Premium collections filter
  const premiumProducts = products.filter((p) => p.isPremium);

  // Combo Builder Math
  const itemsList = [
    { name: 'Venezia Silk Potli Bag', price: 149, active: comboBags, setter: setComboBags },
    { name: 'Heritage Brass Minakari Box', price: 349, active: comboBrass, setter: setComboBrass },
    { name: 'Personalized Gold Foil Card', price: 50, active: comboCard, setter: setComboCard }
  ];

  const rawTotal = itemsList.reduce((sum, item) => sum + (item.active ? item.price : 0), 0);
  const activeCount = itemsList.filter((item) => item.active).length;
  // 15% discount for building a combo of 2+ items
  const discountRate = activeCount >= 2 ? 0.15 : 0;
  const savings = Math.round(rawTotal * discountRate);
  const bundlePrice = rawTotal - savings;

  const handleAddComboToCart = () => {
    const activeItems = itemsList.filter((item) => item.active);
    if (activeItems.length === 0) {
      dispatch(showToast({ message: 'Select at least one accessory to build a bundle', type: 'info' }));
      return;
    }

    // Add each selected item to the cart
    activeItems.forEach((item) => {
      dispatch(
        addToCart({
          productId: `combo_${item.name.replace(/\s+/g, '_')}`,
          title: `[Combo Pack] ${item.name}`,
          price: Math.round(item.price * (1 - discountRate)), // Apply bundle discount rate directly to unit price
          image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=300&auto=format&fit=crop',
          qty: 1,
          stock: 100,
        })
      );
    });

    dispatch(
      showToast({
        message: 'Combo items successfully added to your bag!',
        type: 'success',
      })
    );
  };

  return (
    <div className="space-y-16 pb-20">
      
      {/* Hero Banner Section */}
      <section className="relative bg-slate-50 min-h-[500px] sm:min-h-[580px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={HERO_SLIDES[0].image}
            alt="Hero background"
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="max-w-xl space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 text-gold-hover text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Sabi Premium Collections
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight font-display">
              {HERO_SLIDES[0].title}
            </h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed font-medium">
              {HERO_SLIDES[0].subtitle}
            </p>
            <div className="flex flex-wrap gap-3.5 pt-2">
              <button
                onClick={() => navigate('/shop')}
                className="px-6 py-3.5 bg-gold hover:bg-gold-hover text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md flex items-center gap-2 cursor-pointer"
              >
                Shop Now
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/corporate-gifts')}
                className="px-6 py-3.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs cursor-pointer"
              >
                Corporate Catalogue
              </button>
              <button
                onClick={() => navigate('/wedding-essentials')}
                className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-gold rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md cursor-pointer"
              >
                Wedding Inquiry
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">Shop By Category</h2>
          <p className="text-xs sm:text-sm text-gray-500">Handcrafted return gifts and specialized packages curated for every celebration.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {categories.map((cat) => (
              <div
                key={cat.slug}
                onClick={() => navigate(`/shop?category=${cat.slug}`)}
                className="group relative rounded-2xl overflow-hidden aspect-square border border-gray-100 shadow-3xs cursor-pointer bg-gray-50 flex flex-col justify-end p-4 hover:shadow-md transition-shadow shrink-0"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"></div>
                <h3 className="relative z-10 text-xs sm:text-sm font-bold text-white tracking-wide text-center">
                  {cat.name}
                </h3>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Budget Friendly Store Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="space-y-1 text-center md:text-left">
            <h2 className="text-2xl font-extrabold text-gray-900">Budget Friendly Favors</h2>
            <p className="text-xs text-gray-400">Discover premium quality gifting options mapped to your budget limits.</p>
          </div>
          {/* Budget tabs toggler */}
          <div className="flex flex-wrap gap-2">
            {[99, 199, 299, 499, 999].map((amt) => (
              <button
                key={amt}
                onClick={() => setSelectedBudgetTab(amt)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedBudgetTab === amt
                    ? 'bg-gold border-gold text-white shadow-xs'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Under ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-72 bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : budgetFilteredProducts.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">No items available under this price tier.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {budgetFilteredProducts.slice(0, 4).map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>

      {/* Gold Accent Premium Showcase */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold font-bold text-xs uppercase tracking-wider border border-gold/30">
              Limited Edition
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display text-white">
              The Exclusive Gold-Accent Heritage Series
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
              Hand-painted brass boxes, sandalwood-infused items, and customized silk hampers designed exclusively for luxury gifting portfolios.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-slate-800 p-4 rounded-xl space-y-1">
                <span className="text-gold font-bold text-lg font-display">Premium Packaging</span>
                <p className="text-[10px] text-slate-400">Rigid gold-foil card boxes with velvet lining.</p>
              </div>
              <div className="border border-slate-800 p-4 rounded-xl space-y-1">
                <span className="text-gold font-bold text-lg font-display">Personalized Engraving</span>
                <p className="text-[10px] text-slate-400">Add names or logo initials directly on products.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/shop?isPremium=true')}
              className="px-6 py-3 bg-gold hover:bg-gold-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-md cursor-pointer"
            >
              Explore Premium Range
            </button>
          </div>
          
          <div className="relative rounded-2xl overflow-hidden aspect-video shadow-2xl border border-slate-800">
            <img
              src="https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=800&auto=format&fit=crop"
              alt="Premium showcase"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">Trending Best Sellers</h2>
          <p className="text-xs sm:text-sm text-gray-500">The most popular return gifts selected by our hosts this month.</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-72 bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.slice(0, 4).map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>

      {/* Interactive Combo Builder Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-slate-50 border border-gray-100 rounded-3xl p-8 lg:p-12 shadow-2xs">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          
          {/* Builder controls */}
          <div className="space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-indigo-100">
                Combo Builder
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Build Your Custom Gifting Set</h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                Choose accessories to bundle together. Get a flat 15% discount when you select 2 or more items to build your unique Tambulam favor kit.
              </p>
            </div>

            <div className="space-y-3.5">
              {itemsList.map((item) => (
                <div
                  key={item.name}
                  onClick={() => item.setter(!item.active)}
                  className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${
                    item.active
                      ? 'bg-white border-gold shadow-xs'
                      : 'bg-white/50 border-gray-100 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.active}
                      onChange={() => {}} // Controlled by parent div click
                      className="w-4.5 h-4.5 accent-gold pointer-events-none"
                    />
                    <span className="text-sm font-semibold text-gray-800">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gold">₹{item.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Calculator Output */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3">
                Bundle Calculator Summary
              </h3>
              
              <div className="space-y-3 mt-4 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Selected Accessories ({activeCount})</span>
                  <span className="font-semibold">₹{rawTotal}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold items-center">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5" />
                      15% Combo Discount
                    </span>
                    <span>-₹{savings}</span>
                  </div>
                )}
                <div className="h-px bg-gray-100 my-2" />
                <div className="flex justify-between text-base font-bold text-gray-900 items-baseline">
                  <span>Estimated Combo Cost</span>
                  <span className="text-gold text-2xl font-display">₹{bundlePrice}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleAddComboToCart}
              className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-gold hover:text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider text-xs shadow-md cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              Add Bundle To Bag
            </button>
          </div>

        </div>
      </section>

    </div>
  );
};
