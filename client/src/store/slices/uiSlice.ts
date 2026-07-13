import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  isCartOpen: boolean;
  isSearchOpen: boolean;
  isMobileMenuOpen: boolean;
  activeToast: {
    message: string;
    type: 'success' | 'error' | 'info';
    id: number;
  } | null;
}

const initialState: UiState = {
  isCartOpen: false,
  isSearchOpen: false,
  isMobileMenuOpen: false,
  activeToast: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleCart(state) {
      state.isCartOpen = !state.isCartOpen;
    },
    setCartOpen(state, action: PayloadAction<boolean>) {
      state.isCartOpen = action.payload;
    },
    toggleSearch(state) {
      state.isSearchOpen = !state.isSearchOpen;
    },
    setSearchOpen(state, action: PayloadAction<boolean>) {
      state.isSearchOpen = action.payload;
    },
    toggleMobileMenu(state) {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    setMobileMenuOpen(state, action: PayloadAction<boolean>) {
      state.isMobileMenuOpen = action.payload;
    },
    showToast(state, action: PayloadAction<{ message: string; type: 'success' | 'error' | 'info' }>) {
      state.activeToast = {
        ...action.payload,
        id: Date.now(),
      };
    },
    hideToast(state) {
      state.activeToast = null;
    },
  },
});

export const {
  toggleCart,
  setCartOpen,
  toggleSearch,
  setSearchOpen,
  toggleMobileMenu,
  setMobileMenuOpen,
  showToast,
  hideToast,
} = uiSlice.actions;

export default uiSlice.reducer;
