import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  addresses: any[];
  walletBalance: number;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    loginSuccess(state, action: PayloadAction<UserProfile>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
    logoutSuccess(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('sabi_fallback_token');
    },
    updateUserAddresses(state, action: PayloadAction<any[]>) {
      if (state.user) {
        state.user.addresses = action.payload;
      }
    },
    updateWallet(state, action: PayloadAction<number>) {
      if (state.user) {
        state.user.walletBalance = action.payload;
      }
    },
    setAuthError(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setAuthLoading,
  loginSuccess,
  logoutSuccess,
  updateUserAddresses,
  updateWallet,
  setAuthError,
} = authSlice.actions;

export default authSlice.reducer;
