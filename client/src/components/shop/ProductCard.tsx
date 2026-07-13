import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { addToCart } from '../../store/slices/cartSlice';
import { toggleWishlist } from '../../store/slices/wishlistSlice';
import { showToast } from '../../store/slices/uiSlice';
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export interface ProductProps {
  id: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category: string;
  occasions?: string[];
  rating: number;
  reviewsCount: number;
  isPremium?: boolean;
  isBestSeller?: boolean;
  stock: number;
  variants?: any[];
}

export const ProductCard: React.FC<{ product: ProductProps; onQuickView?: (p: ProductProps) => void }> = ({
  product,
  onQuickView,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const isInWishlist = wishlistItems.some((item) => item.id === product.id);

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock === 0) {
      dispatch(showToast({ message: 'Product is currently out of stock', type: 'error' }));
      return;
    }

    const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0] : undefined;

    dispatch(
      addToCart({
        productId: product.id,
        variantId: defaultVariant?.id,
        title: product.title,
        price: product.price,
        image: product.images[0] || '',
        qty: 1,
        stock: product.stock,
        color: defaultVariant?.color,
        size: defaultVariant?.size,
      })
    );

    dispatch(
      showToast({
        message: `Added 1 ${product.title} to bag`,
        type: 'success',
      })
    );
  };

  return (
    <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden relative interactive-hover flex flex-col h-full">
      {/* Badges Overlay */}
      <div className="absolute top-3.5 left-3.5 z-10 flex flex-col gap-1">
        {product.isPremium && (
          <span className="text-[9px] bg-slate-900 text-gold font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs border border-gold/40">
            Premium
          </span>
        )}
        {product.isBestSeller && (
          <span className="text-[9px] bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
            Bestseller
          </span>
        )}
      </div>

      {/* Wishlist Icon */}
      <button
        onClick={handleToggleWishlist}
        className="absolute top-3.5 right-3.5 z-10 p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-rose-500 shadow-xs backdrop-blur-xs transition-colors cursor-pointer"
        title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
      </button>

      {/* Product Image */}
      <Link to={`/products/${product.id}`} className="relative block overflow-hidden bg-gray-50 aspect-square shrink-0">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop'}
          alt={product.title}
          className="w-full h-full object-cover zoom-effect"
          loading="lazy"
        />
        
        {/* Quick View Button on Hover */}
        {onQuickView && (
          <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              className="px-4 py-2 bg-white/95 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              Quick View
            </button>
          </div>
        )}
      </Link>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
        <div className="space-y-1">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{product.category.replace('-', ' ')}</p>
          <Link to={`/products/${product.id}`} className="block">
            <h3 className="text-xs font-bold text-gray-800 line-clamp-2 group-hover:text-gold transition-colors">
              {product.title}
            </h3>
          </Link>
          
          {/* Rating stars */}
          <div className="flex items-center gap-1">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] font-bold text-gray-500">({product.reviewsCount})</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold text-gray-900 font-display">₹{product.price}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-[10px] text-gray-400 line-through">₹{product.compareAtPrice}</span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            className="p-2 bg-gold hover:bg-gold-hover text-white rounded-lg transition-colors cursor-pointer"
            title="Add to cart"
            disabled={product.stock === 0}
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
