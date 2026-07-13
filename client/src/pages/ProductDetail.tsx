import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { useAppDispatch, useAppSelector } from '../store';
import { addToCart } from '../store/slices/cartSlice';
import { toggleWishlist } from '../store/slices/wishlistSlice';
import { showToast } from '../store/slices/uiSlice';
import { Star, Truck, ShieldCheck, Heart, Sparkles, Send } from 'lucide-react';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Gallery Active image
  const [activeImage, setActiveImage] = useState<string>('');

  // Variants selection state
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  // Delivery pin checker
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<{ message: string; success: boolean } | null>(null);

  // Info Tabs
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'faqs' | 'reviews'>('desc');

  // Review Submission
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [submittingReview, setSubmittingReview] = useState(false);

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const isInWishlist = wishlistItems.some((item) => item.id === id);

  useEffect(() => {
    const loadProductData = async () => {
      setLoading(true);
      try {
        const res = await apiRequest(`/products/${id}`);
        if (res.success) {
          setProduct(res.data);
          setActiveImage(res.data.images[0] || '');
          if (res.data.variants && res.data.variants.length > 0) {
            setSelectedVariant(res.data.variants[0]);
          }
        }

        // Fetch reviews
        const reviewsRes = await apiRequest(`/reviews/product/${id}`);
        if (reviewsRes.success) {
          setReviews(reviewsRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadProductData();
  }, [id]);

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.trim().length !== 6 || isNaN(Number(pincode))) {
      setPincodeStatus({ message: 'Enter a valid 6-digit postal code', success: false });
      return;
    }
    // Simulate lookup
    setPincodeStatus({
      message: 'Express Delivery available. Delivered within 3-5 business days.',
      success: true,
    });
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (product.stock === 0) {
      dispatch(showToast({ message: 'Out of Stock', type: 'error' }));
      return;
    }

    dispatch(
      addToCart({
        productId: product.id,
        variantId: selectedVariant?.id,
        title: product.title,
        price: selectedVariant ? selectedVariant.price : product.price,
        image: product.images[0] || '',
        qty: 1,
        stock: selectedVariant ? selectedVariant.stock : product.stock,
        color: selectedVariant?.color,
        size: selectedVariant?.size,
      })
    );

    dispatch(
      showToast({
        message: `Added ${product.title} to bag`,
        type: 'success',
      })
    );
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    dispatch(
      toggleWishlist({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images[0] || '',
        category: product.category,
        stock: product.stock,
      })
    );
    dispatch(
      showToast({
        message: isInWishlist ? 'Removed from wishlist' : 'Saved to wishlist',
        type: 'info',
      })
    );
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      dispatch(showToast({ message: 'Please sign in to write reviews.', type: 'info' }));
      navigate('/auth');
      return;
    }

    if (!newComment.trim()) {
      dispatch(showToast({ message: 'Review comment cannot be empty', type: 'error' }));
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await apiRequest('/reviews', {
        method: 'POST',
        data: {
          productId: product.id,
          rating: newRating,
          comment: newComment.trim(),
        },
      });

      if (res.success) {
        dispatch(showToast({ message: res.message, type: 'success' }));
        setNewComment('');
        // Append locally for previewing
        setReviews([
          {
            id: `rev_${Date.now()}`,
            userName: 'You (Review under moderation)',
            rating: newRating,
            comment: newComment.trim(),
            createdAt: new Date().toISOString(),
            approved: false,
          },
          ...reviews,
        ]);
      }
    } catch (err: any) {
      dispatch(showToast({ message: err.message, type: 'error' }));
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex justify-center items-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-500">Loading gift details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-gray-500 font-bold">Product not found</p>
        <button
          onClick={() => navigate('/shop')}
          className="mt-4 px-6 py-2.5 bg-gold text-white font-bold rounded-lg text-xs uppercase"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Top Details container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* Left Column: Visual Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 relative shadow-2xs">
            <img
              src={activeImage}
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
            {product.isPremium && (
              <span className="absolute top-4 left-4 bg-slate-900 text-gold font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-gold/40 shadow-xs">
                Premium
              </span>
            )}
          </div>
          
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-1">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 bg-gray-50 rounded-xl overflow-hidden border transition-all shrink-0 cursor-pointer ${
                    activeImage === img ? 'border-gold shadow-xs' : 'border-gray-200'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Descriptions & Actions */}
        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-gold uppercase tracking-wider">{product.category.replace('-', ' ')}</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight font-display">{product.title}</h2>
            
            {/* Rating counts */}
            <div className="flex items-center gap-2">
              <div className="flex items-center text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="text-sm font-bold text-gray-800 ml-1">{product.rating}</span>
              </div>
              <span className="text-xs text-gray-400">({product.reviewsCount} verified reviews)</span>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-display">
              ₹{selectedVariant ? selectedVariant.price : product.price}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-sm text-gray-400 line-through">₹{product.compareAtPrice}</span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
            {product.description}
          </p>

          {/* Variants selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-800">Select Style / Options</span>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selectedVariant?.id === v.id
                        ? 'bg-gold/15 border-gold text-gold-hover shadow-3xs'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {v.color || v.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Availability indicator */}
          <div className="text-xs font-bold">
            {product.stock > 0 ? (
              <span className="text-emerald-600">✓ In Stock ({product.stock} items available)</span>
            ) : (
              <span className="text-rose-500">✗ Out of Stock</span>
            )}
          </div>

          {/* Checkout triggers */}
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 min-w-[200px] py-4 bg-gold hover:bg-gold-hover text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              disabled={product.stock === 0}
            >
              Add to Bag
            </button>
            <button
              onClick={handleWishlistToggle}
              className={`p-4 border rounded-xl transition-all cursor-pointer ${
                isInWishlist ? 'border-rose-100 bg-rose-50/50 text-rose-500' : 'border-gray-200 text-gray-500 hover:text-gold hover:bg-gray-50'
              }`}
              title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-rose-500' : ''}`} />
            </button>
          </div>

          {/* Delivery Checker Widget */}
          <div className="border border-gray-100 rounded-2xl p-4 bg-slate-50 shadow-3xs space-y-3">
            <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5 uppercase">
              <Truck className="w-4 h-4 text-gold" />
              Check Delivery Eligibility
            </h4>
            <form onSubmit={handlePincodeCheck} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 6-digit pincode"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Verify
              </button>
            </form>
            {pincodeStatus && (
              <p className={`text-[10px] font-bold ${pincodeStatus.success ? 'text-emerald-600' : 'text-rose-500'}`}>
                {pincodeStatus.message}
              </p>
            )}
          </div>

        </div>
      </div>

      {/* Tabs segment: Specs, FAQs, Reviews */}
      <div className="border-t border-gray-100 pt-8 space-y-6">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {[
            { id: 'desc', label: 'Description & Care' },
            { id: 'specs', label: 'Specifications' },
            { id: 'faqs', label: 'FAQs' },
            { id: 'reviews', label: `Reviews (${reviews.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3.5 px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-gold text-gold-hover'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[150px] text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
          {activeTab === 'desc' && (
            <div className="space-y-4">
              <p>{product.description}</p>
              <div className="bg-slate-50 border border-gray-100 p-4 rounded-xl space-y-1 max-w-md">
                <span className="text-xs font-bold text-gray-800 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Sabi Gifting Guarantee
                </span>
                <p className="text-[10px] text-gray-500">Every piece passes three tier quality check parameters and is vacuum-wrapped before delivery dispatch.</p>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="max-w-md border border-gray-100 rounded-xl overflow-hidden shadow-3xs">
              {product.specifications && product.specifications.length > 0 ? (
                product.specifications.map((spec: any, idx: number) => (
                  <div
                    key={idx}
                    className={`grid grid-cols-2 p-3 text-xs border-b border-gray-50 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    }`}
                  >
                    <span className="font-bold text-gray-500">{spec.key}</span>
                    <span className="text-gray-800 font-semibold">{spec.value}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-gray-400 text-center">No specifications detailed.</div>
              )}
            </div>
          )}

          {activeTab === 'faqs' && (
            <div className="space-y-4 max-w-2xl">
              {product.faqs && product.faqs.length > 0 ? (
                product.faqs.map((faq: any, idx: number) => (
                  <div key={idx} className="space-y-1.5 p-4 border border-gray-100 rounded-xl">
                    <p className="font-bold text-gray-800">Q: {faq.question}</p>
                    <p className="text-gray-500 font-semibold pl-4">A: {faq.answer}</p>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-center py-6">No FAQs recorded yet.</div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Reviews List */}
              <div className="lg:col-span-2 space-y-4">
                {reviews.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 font-medium">
                    No reviews yet. Be the first to share your experience!
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div key={rev.id} className="p-4 border border-gray-100 rounded-xl space-y-2 bg-white">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800">{rev.userName}</span>
                        <span className="text-[10px] text-gray-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 font-semibold">{rev.comment}</p>
                      {!rev.approved && (
                        <span className="inline-block text-[8px] bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                          Awaiting Approval
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Review submit form */}
              <div className="bg-slate-50 border border-gray-100 p-5 rounded-2xl shadow-3xs h-fit space-y-4">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-gold" />
                  Write a review
                </h4>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Rating Star</span>
                    <div className="flex gap-1.5 text-gray-300">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          onClick={() => setNewRating(star)}
                          className={`w-6 h-6 cursor-pointer ${
                            star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 hover:text-amber-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Share details</span>
                    <textarea
                      placeholder="Share your experience (quality, look, delivery speed)..."
                      rows={4}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-medium outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit Review
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
