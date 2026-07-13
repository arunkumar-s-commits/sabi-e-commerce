import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { ProductCard, ProductProps } from '../components/shop/ProductCard';
import { SlidersHorizontal, ArrowUpDown, X, Star } from 'lucide-react';

export const Shop: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<ProductProps[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const [selectedOccasion, setSelectedOccasion] = useState<string>(searchParams.get('occasion') || '');
  const [priceRange, setPriceRange] = useState<number>(Number(searchParams.get('maxPrice')) || 2000);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [onlyPremium, setOnlyPremium] = useState<boolean>(searchParams.get('isPremium') === 'true');
  const [selectedSort, setSelectedSort] = useState<string>('default');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('search') || '');

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sync search parameters from URL changes (e.g. from Mega menu clicks)
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || '');
    setSelectedOccasion(searchParams.get('occasion') || '');
    setPriceRange(Number(searchParams.get('maxPrice')) || 2000);
    setOnlyPremium(searchParams.get('isPremium') === 'true');
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    const loadShopData = async () => {
      setLoading(true);
      try {
        const catRes = await apiRequest('/categories');
        if (catRes.success) {
          setCategories(catRes.data);
        }

        // Fetch products (filters post-processed to avoid index configuration requirements in firestore sandbox)
        const prodRes = await apiRequest('/products');
        if (prodRes.success) {
          setProducts(prodRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadShopData();
  }, []);

  // Update query parameters in URL when filters change
  const applyParams = (category: string, occasion: string, maxPrice: number, premium: boolean) => {
    const params: any = {};
    if (category) params.category = category;
    if (occasion) params.occasion = occasion;
    if (maxPrice && maxPrice < 2000) params.maxPrice = maxPrice.toString();
    if (premium) params.isPremium = 'true';
    if (searchQuery) params.search = searchQuery;
    setSearchParams(params);
  };

  const handleCategoryFilter = (slug: string) => {
    const target = selectedCategory === slug ? '' : slug;
    setSelectedCategory(target);
    applyParams(target, selectedOccasion, priceRange, onlyPremium);
  };

  const handleOccasionFilter = (occ: string) => {
    const target = selectedOccasion === occ ? '' : occ;
    setSelectedOccasion(target);
    applyParams(selectedCategory, target, priceRange, onlyPremium);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const priceVal = Number(e.target.value);
    setPriceRange(priceVal);
    applyParams(selectedCategory, selectedOccasion, priceVal, onlyPremium);
  };

  const handlePremiumToggle = () => {
    const target = !onlyPremium;
    setOnlyPremium(target);
    applyParams(selectedCategory, selectedOccasion, priceRange, target);
  };

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSelectedOccasion('');
    setPriceRange(2000);
    setSelectedRating(null);
    setOnlyPremium(false);
    setSearchQuery('');
    setSearchParams({});
  };

  // Perform client-side filter computation
  let filteredProducts = products.filter((p) => {
    if (selectedCategory && p.category !== selectedCategory) return false;
    if (selectedOccasion && (!p.occasions || !p.occasions.includes(selectedOccasion))) return false;
    if (p.price > priceRange) return false;
    if (selectedRating && p.rating < selectedRating) return false;
    if (onlyPremium && !p.isPremium) return false;
    
    // Text search query matching
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }

    return true;
  });

  // Apply Sorting
  if (selectedSort === 'price_asc') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (selectedSort === 'price_desc') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (selectedSort === 'rating') {
    filteredProducts.sort((a, b) => b.rating - a.rating);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Top Banner/Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 font-display">Gifting Collections</h2>
          <p className="text-xs text-gray-500 mt-1">
            Showing {filteredProducts.length} items {searchQuery ? `matching "${searchQuery}"` : ''}
          </p>
        </div>

        {/* Sort & Mobile filter trigger */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-white cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
          
          <div className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl bg-white">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="text-xs font-semibold text-gray-700 outline-none bg-transparent cursor-pointer"
            >
              <option value="default">Sort: Recommended</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6">
          {/* Categories Filter */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2">Categories</h4>
            <div className="space-y-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => handleCategoryFilter(cat.slug)}
                  className={`flex items-center justify-between w-full text-xs font-semibold py-1 px-1.5 rounded-lg transition-colors cursor-pointer ${
                    selectedCategory === cat.slug
                      ? 'bg-gold/10 text-gold-hover'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Occasion Filter */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2">Occasion</h4>
            <div className="space-y-1.5">
              {['Wedding', 'Birthday', 'Housewarming', 'Baby Shower', 'Corporate Event', 'Festival'].map((occ) => (
                <button
                  key={occ}
                  onClick={() => handleOccasionFilter(occ)}
                  className={`flex items-center justify-between w-full text-xs font-semibold py-1 px-1.5 rounded-lg transition-colors cursor-pointer ${
                    selectedOccasion === occ
                      ? 'bg-gold/10 text-gold-hover'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{occ}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2">Max Price</h4>
            <div className="space-y-2">
              <input
                type="range"
                min="99"
                max="2000"
                step="50"
                value={priceRange}
                onChange={handlePriceChange}
                className="w-full accent-gold cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 font-semibold">
                <span>₹99</span>
                <span className="text-gold font-bold">₹{priceRange}</span>
                <span>₹2000+</span>
              </div>
            </div>
          </div>

          {/* Rating filter */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2">Customer Rating</h4>
            <div className="space-y-1.5">
              {[4, 3].map((stars) => (
                <button
                  key={stars}
                  onClick={() => setSelectedRating(selectedRating === stars ? null : stars)}
                  className={`flex items-center gap-1.5 text-xs font-semibold py-1 px-1.5 rounded-lg w-full text-left transition-colors cursor-pointer ${
                    selectedRating === stars ? 'bg-gold/10 text-gold-hover' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{stars}★ & above</span>
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Premium items */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-gray-100 rounded-xl">
            <div>
              <p className="text-xs font-bold text-gray-800">Premium Luxury Items</p>
              <p className="text-[10px] text-gray-400">Exclusive gold accent series</p>
            </div>
            <input
              type="checkbox"
              checked={onlyPremium}
              onChange={handlePremiumToggle}
              className="w-4 h-4 accent-gold cursor-pointer"
            />
          </div>

          {/* Reset Filters button */}
          <button
            onClick={clearAllFilters}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </aside>

        {/* Product Grid Content */}
        <main className="lg:col-span-3 space-y-6">
          
          {/* Active filter chips */}
          {(selectedCategory || selectedOccasion || priceRange < 2000 || selectedRating || onlyPremium || searchQuery) && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Active filters:</span>
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gold/15 text-gold-hover px-2.5 py-1 rounded-full">
                  Category: {selectedCategory.replace('-', ' ')}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleCategoryFilter(selectedCategory)} />
                </span>
              )}
              {selectedOccasion && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gold/15 text-gold-hover px-2.5 py-1 rounded-full">
                  Occasion: {selectedOccasion}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleOccasionFilter(selectedOccasion)} />
                </span>
              )}
              {priceRange < 2000 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gold/15 text-gold-hover px-2.5 py-1 rounded-full">
                  Under ₹{priceRange}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => { setPriceRange(2000); applyParams(selectedCategory, selectedOccasion, 2000, onlyPremium); }} />
                </span>
              )}
              {onlyPremium && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gold/15 text-gold-hover px-2.5 py-1 rounded-full">
                  Luxury Series
                  <X className="w-3 h-3 cursor-pointer" onClick={handlePremiumToggle} />
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gold/15 text-gold-hover px-2.5 py-1 rounded-full">
                  Search: {searchQuery}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => { setSearchQuery(''); applyParams(selectedCategory, selectedOccasion, priceRange, onlyPremium); }} />
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-rose-500 font-bold hover:underline ml-2"
              >
                Clear All
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-72 bg-gray-50 border border-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <p className="text-base font-semibold text-gray-800">No matching return gifts found</p>
              <p className="text-xs text-gray-400">Try adjusting your filters or searching for something else.</p>
              <button
                onClick={clearAllFilters}
                className="mt-2 px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 bg-white"
              >
                Clear Active Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Drawer Slide-out Filter Panel */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden flex justify-start">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileFilterOpen(false)} />
          <div className="relative w-full max-w-xs h-full bg-white p-6 shadow-xl flex flex-col justify-between z-10 animate-slide-in">
            <div className="space-y-6 overflow-y-auto pr-1">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-sm font-bold text-gray-800">Filter Catalogue</h3>
                <X className="w-5 h-5 text-gray-400" onClick={() => setIsMobileFilterOpen(false)} />
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase">Categories</h4>
                <div className="flex flex-col gap-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => handleCategoryFilter(cat.slug)}
                      className={`text-left text-xs py-1.5 px-2 rounded-lg font-semibold ${
                        selectedCategory === cat.slug ? 'bg-gold/10 text-gold-hover' : 'text-gray-600'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Occasion */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase">Occasion</h4>
                <div className="flex flex-col gap-1">
                  {['Wedding', 'Birthday', 'Housewarming', 'Baby Shower', 'Festival'].map((occ) => (
                    <button
                      key={occ}
                      onClick={() => handleOccasionFilter(occ)}
                      className={`text-left text-xs py-1.5 px-2 rounded-lg font-semibold ${
                        selectedOccasion === occ ? 'bg-gold/10 text-gold-hover' : 'text-gray-600'
                      }`}
                    >
                      {occ}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase">Max Price: ₹{priceRange}</h4>
                <input
                  type="range"
                  min="99"
                  max="2000"
                  step="50"
                  value={priceRange}
                  onChange={handlePriceChange}
                  className="w-full accent-gold"
                />
              </div>

              {/* Toggle Premium */}
              <label className="flex items-center gap-3 p-2 border border-gray-100 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyPremium}
                  onChange={handlePremiumToggle}
                  className="w-4 h-4 accent-gold"
                />
                <span className="text-xs font-semibold text-gray-700">Show Premium Gifting Only</span>
              </label>
            </div>

            <button
              onClick={() => setIsMobileFilterOpen(false)}
              className="w-full py-3 bg-gold hover:bg-gold-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs cursor-pointer mt-4"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
