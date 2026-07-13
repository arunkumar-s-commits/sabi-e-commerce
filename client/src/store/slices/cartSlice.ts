import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  productId: string;
  variantId?: string;
  title: string;
  price: number;
  image: string;
  qty: number;
  stock: number;
  color?: string;
  size?: string;
}

interface CouponDetails {
  code: string;
  type: 'percentage' | 'flat' | 'free_shipping';
  value: number;
  discountAmount: number;
}

interface CartState {
  items: CartItem[];
  giftWrapping: boolean;
  coupon: CouponDetails | null;
  shippingCharge: number;
}

const initialState: CartState = {
  items: [],
  giftWrapping: false,
  coupon: null,
  shippingCharge: 99,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {
      const { productId, variantId, qty } = action.payload;
      const existingItemIndex = state.items.findIndex(
        (item) => item.productId === productId && item.variantId === variantId
      );

      if (existingItemIndex > -1) {
        const newQty = state.items[existingItemIndex].qty + qty;
        state.items[existingItemIndex].qty = Math.min(newQty, action.payload.stock);
      } else {
        state.items.push(action.payload);
      }
      
      // Re-calculate shipping (free above 1000)
      const subtotal = state.items.reduce((sum, item) => sum + item.price * item.qty, 0);
      state.shippingCharge = subtotal >= 1000 || (state.coupon?.type === 'free_shipping') ? 0 : 99;
    },
    updateQuantity(state, action: PayloadAction<{ productId: string; variantId?: string; qty: number }>) {
      const { productId, variantId, qty } = action.payload;
      const index = state.items.findIndex(
        (item) => item.productId === productId && item.variantId === variantId
      );

      if (index > -1) {
        state.items[index].qty = Math.min(Math.max(1, qty), state.items[index].stock);
      }

      const subtotal = state.items.reduce((sum, item) => sum + item.price * item.qty, 0);
      state.shippingCharge = subtotal >= 1000 || (state.coupon?.type === 'free_shipping') ? 0 : 99;
    },
    removeFromCart(state, action: PayloadAction<{ productId: string; variantId?: string }>) {
      const { productId, variantId } = action.payload;
      state.items = state.items.filter(
        (item) => !(item.productId === productId && item.variantId === variantId)
      );

      const subtotal = state.items.reduce((sum, item) => sum + item.price * item.qty, 0);
      state.shippingCharge = subtotal >= 1000 || (state.coupon?.type === 'free_shipping') ? 0 : 99;

      if (state.items.length === 0) {
        state.coupon = null;
      }
    },
    toggleGiftWrapping(state) {
      state.giftWrapping = !state.giftWrapping;
    },
    applyCoupon(state, action: PayloadAction<CouponDetails>) {
      state.coupon = action.payload;
      if (action.payload.type === 'free_shipping') {
        state.shippingCharge = 0;
      }
    },
    removeCoupon(state) {
      state.coupon = null;
      const subtotal = state.items.reduce((sum, item) => sum + item.price * item.qty, 0);
      state.shippingCharge = subtotal >= 1000 ? 0 : 99;
    },
    clearCart(state) {
      state.items = [];
      state.giftWrapping = false;
      state.coupon = null;
      state.shippingCharge = 99;
    },
  },
});

export const {
  addToCart,
  updateQuantity,
  removeFromCart,
  toggleGiftWrapping,
  applyCoupon,
  removeCoupon,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
