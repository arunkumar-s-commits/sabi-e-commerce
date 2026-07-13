import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { updateQuantity, removeFromCart, toggleGiftWrapping, applyCoupon, removeCoupon } from '../store/slices/cartSlice';
import { showToast } from '../store/slices/uiSlice';
import { Trash2, Gift, Ticket, ArrowRight, ShoppingBag } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../services/api';

export const Cart: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { items, giftWrapping, coupon, shippingCharge } = useAppSelector((state) => state.cart);
  const [couponCode, setCouponCode] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const giftWrapCharge = giftWrapping ? 30 : 0;

  let discount = 0;
  if (coupon) {
    if (coupon.type === 'percentage') {
      discount = Math.round((subtotal * coupon.value) / 100);
    } else if (coupon.type === 'flat') {
      discount = coupon.value;
    }
  }

  const grandTotal = subtotal + shippingCharge + giftWrapCharge - discount;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      dispatch(showToast({ message: 'Please enter a coupon code', type: 'error' }));
      return;
    }

    setValidatingCoupon(true);
    try {
      const res = await apiRequest('/coupons/validate', {
        method: 'POST',
        data: {
          code: couponCode.trim(),
          subtotal,
        },
      });

      if (res.success) {
        dispatch(applyCoupon(res.data));
        dispatch(showToast({ message: 'Coupon applied successfully!', type: 'success' }));
        setCouponCode('');
      }
    } catch (err: any) {
      dispatch(showToast({ message: err.message || 'Invalid coupon code', type: 'error' }));
    } finally {
      setValidatingCoupon(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Your shopping bag is empty</h2>
          <p className="text-xs text-gray-400 mt-1">Fill it with premium wedding returns, hampers and traditional gifts.</p>
        </div>
        <Link
          to="/shop"
          className="inline-block px-8 py-3.5 bg-gold hover:bg-gold-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-md"
        >
          Explore Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <h2 className="text-2xl font-extrabold text-gray-900 font-display border-b border-gray-100 pb-4">
        Shopping Cart ({items.length} items)
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        
        {/* Left Side: Items list */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId || ''}`}
              className="flex flex-col sm:flex-row gap-4 p-4 border border-gray-100 rounded-2xl bg-white shadow-3xs hover:shadow-2xs transition-shadow"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-24 h-24 object-cover rounded-xl bg-gray-50 shrink-0 mx-auto sm:mx-0"
              />
              
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row justify-between gap-1">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-800">{item.title}</h3>
                    {item.color && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Style: {item.color} {item.size ? `/ ${item.size}` : ''}
                      </p>
                    )}
                  </div>
                  <span className="text-sm sm:text-base font-bold text-gold shrink-0">₹{item.price}</span>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center border border-gray-100 rounded-lg">
                    <button
                      onClick={() =>
                        dispatch(updateQuantity({ productId: item.productId, variantId: item.variantId, qty: item.qty - 1 }))
                      }
                      className="px-3 py-1.5 text-gray-400 hover:text-gray-600 font-bold"
                    >
                      -
                    </button>
                    <span className="px-3.5 text-xs font-bold text-gray-700">{item.qty}</span>
                    <button
                      onClick={() =>
                        dispatch(updateQuantity({ productId: item.productId, variantId: item.variantId, qty: item.qty + 1 }))
                      }
                      className="px-3 py-1.5 text-gray-400 hover:text-gray-600 font-bold"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => dispatch(removeFromCart({ productId: item.productId, variantId: item.variantId }))}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-rose-500 font-semibold transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Side: Order Summary Panel */}
        <div className="space-y-6">
          
          {/* Coupon Entry widget */}
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-3xs space-y-4">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-50 pb-2.5">
              <Ticket className="w-4.5 h-4.5 text-gold" />
              Apply Promo Code
            </h3>
            
            {coupon ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl p-3.5">
                <span className="text-xs font-semibold text-emerald-800">
                  Applied: <strong className="underline">{coupon.code}</strong>
                </span>
                <button
                  onClick={() => dispatch(removeCoupon())}
                  className="text-xs text-rose-500 font-bold hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. WELCOME10, SABI500"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium outline-none uppercase"
                />
                <button
                  type="submit"
                  disabled={validatingCoupon}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </form>
            )}
          </div>

          {/* Gift Wrap option */}
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-3xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-gold shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-800">Add Premium Gift Wrap</p>
                <p className="text-[9px] text-gray-400 mt-0.5">Velvet ribbons + custom note card (+₹30)</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={giftWrapping}
              onChange={() => dispatch(toggleGiftWrapping())}
              className="w-4.5 h-4.5 accent-gold cursor-pointer"
            />
          </div>

          {/* Price Summary display */}
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b border-gray-50 pb-2.5">
              Order Pricing Summary
            </h3>
            
            <div className="space-y-2 text-xs sm:text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-gray-800">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span className="font-semibold text-gray-800">
                  {shippingCharge === 0 ? <span className="text-emerald-600">FREE</span> : `₹${shippingCharge}`}
                </span>
              </div>
              {giftWrapping && (
                <div className="flex justify-between">
                  <span>Gift Wrapping</span>
                  <span className="font-semibold text-gray-800">₹30</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="h-px bg-gray-100 my-3" />
              <div className="flex justify-between text-base font-bold text-gray-900">
                <span>Grand Total</span>
                <span className="text-gold font-display text-lg">₹{grandTotal}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-4 bg-gold hover:bg-gold-hover text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors uppercase tracking-wider text-xs shadow-md cursor-pointer"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
