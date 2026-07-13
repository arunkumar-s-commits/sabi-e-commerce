import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setCartOpen, toggleCart } from '../../store/slices/uiSlice';
import { updateQuantity, removeFromCart, toggleGiftWrapping, removeCoupon } from '../../store/slices/cartSlice';
import { X, Trash2, ShoppingBag, Gift, Ticket, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CartSidebar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const isOpen = useAppSelector((state) => state.ui.isCartOpen);
  const { items, giftWrapping, coupon, shippingCharge } = useAppSelector((state) => state.cart);

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

  const handleCheckoutRedirect = () => {
    dispatch(setCartOpen(false));
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end">
      {/* Backdrop */}
      <div
        onClick={() => dispatch(setCartOpen(false))}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col z-10 animate-slide-in">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-bold text-gray-800">Your Gift Bag ({items.length})</h2>
          </div>
          <button
            onClick={() => dispatch(setCartOpen(false))}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-800">Your bag is empty</p>
                <p className="text-xs text-gray-400 mt-1">Add premium favors and personalized return gifts to continue.</p>
              </div>
              <button
                onClick={() => {
                  dispatch(setCartOpen(false));
                  navigate('/shop');
                }}
                className="px-6 py-2.5 bg-gold hover:bg-gold-hover text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
              >
                Shop Collections
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId || ''}`}
                  className="flex gap-4 p-3 border border-gray-100 rounded-xl hover:shadow-xs transition-shadow"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-20 h-20 object-cover rounded-lg bg-gray-50"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 line-clamp-1">{item.title}</h4>
                      {item.color && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Style: {item.color} {item.size ? `/ ${item.size}` : ''}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-gold mt-1">₹{item.price}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-100 rounded-md">
                        <button
                          onClick={() =>
                            dispatch(updateQuantity({ productId: item.productId, variantId: item.variantId, qty: item.qty - 1 }))
                          }
                          className="px-2.5 py-1 text-gray-400 hover:text-gray-600 font-medium"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold text-gray-700">{item.qty}</span>
                        <button
                          onClick={() =>
                            dispatch(updateQuantity({ productId: item.productId, variantId: item.variantId, qty: item.qty + 1 }))
                          }
                          className="px-2.5 py-1 text-gray-400 hover:text-gray-600 font-medium"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => dispatch(removeFromCart({ productId: item.productId, variantId: item.variantId }))}
                        className="text-gray-300 hover:text-rose-500 transition-colors p-1"
                        title="Remove product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary (Only visible if items in cart) */}
        {items.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-slate-50 space-y-4">
            {/* Gift Wrapping toggle */}
            <div className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-3.5 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <Gift className="w-5 h-5 text-gold" />
                <div>
                  <p className="text-xs font-semibold text-gray-800">Add Premium Gift Wrapping</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Complimentary tag, box wrap & greeting card (+₹30)</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={giftWrapping}
                onChange={() => dispatch(toggleGiftWrapping())}
                className="w-4.5 h-4.5 accent-gold cursor-pointer"
              />
            </div>

            {/* Applied Coupons indicator */}
            {coupon && (
              <div className="flex items-center justify-between bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs font-semibold text-emerald-800">
                    Coupon <span className="underline">{coupon.code}</span> applied!
                  </p>
                </div>
                <button
                  onClick={() => dispatch(removeCoupon())}
                  className="text-xs text-rose-500 font-bold hover:underline"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
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
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Coupon Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="h-px bg-gray-200 my-2" />
              <div className="flex justify-between text-base font-bold text-gray-800">
                <span>Grand Total</span>
                <span className="text-gold font-display text-lg">₹{grandTotal}</span>
              </div>
            </div>

            <button
              onClick={handleCheckoutRedirect}
              className="w-full py-3.5 bg-gold hover:bg-gold-hover text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors uppercase tracking-wider text-xs shadow-md cursor-pointer"
            >
              Checkout Now
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
