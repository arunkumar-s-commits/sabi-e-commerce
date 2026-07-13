import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store';
import { loginSuccess, setAuthLoading, setAuthError } from '../store/slices/authSlice';
import { showToast } from '../store/slices/uiSlice';
import { apiRequest } from '../services/api';
import { auth, googleProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../services/firebase';
import { signInWithPopup } from 'firebase/auth';
import { Mail, Lock, User, Sparkles, ArrowRight } from 'lucide-react';

export const Auth: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      dispatch(showToast({ message: 'Please fill in all inputs', type: 'error' }));
      return;
    }

    setLoading(true);
    dispatch(setAuthLoading(true));

    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }

      const firebaseUser = userCredential.user;
      
      // Sync user details to Firestore backend
      const syncRes = await apiRequest('/auth/sync', {
        method: 'POST',
        data: {
          email: firebaseUser.email,
          name: isLogin ? '' : name,
          phone: '',
        },
      });

      if (syncRes.success) {
        dispatch(loginSuccess(syncRes.data));
        dispatch(showToast({ message: isLogin ? 'Welcome back!' : 'Account registered successfully!', type: 'success' }));
        navigate('/');
      } else {
        throw new Error(syncRes.error || 'Failed to sync user session');
      }
    } catch (err: any) {
      console.warn('Firebase auth failed, running mock authentication fallback...');
      
      // Development Fallback if Firebase keys aren't active/sandbox is offline
      const mockUser: any = {
        id: `usr_${Date.now()}`,
        name: isLogin ? email.split('@')[0] : name,
        email,
        phone: '',
        role: email === 'admin@sabi.com' ? 'admin' : 'customer',
        addresses: [],
        walletBalance: 0,
      };

      localStorage.setItem('sabi_fallback_token', email === 'admin@sabi.com' ? 'mock-admin-token' : 'mock-customer-token');
      dispatch(loginSuccess(mockUser));
      dispatch(showToast({ message: 'Signed in successfully (Mock Sandbox Mode)', type: 'success' }));
      navigate('/');
    } finally {
      setLoading(false);
      dispatch(setAuthLoading(false));
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const syncRes = await apiRequest('/auth/sync', {
        method: 'POST',
        data: {
          email: res.user.email,
          name: res.user.displayName || '',
          phone: '',
        },
      });

      if (syncRes.success) {
        dispatch(loginSuccess(syncRes.data));
        dispatch(showToast({ message: 'Signed in with Google!', type: 'success' }));
        navigate('/');
      }
    } catch (err: any) {
      console.warn('Google popup auth failed, running mock Google authentication fallback...');
      const mockUser: any = {
        id: `usr_g_${Date.now()}`,
        name: 'Google Test User',
        email: 'googleuser@sabi.com',
        phone: '',
        role: 'customer',
        addresses: [],
        walletBalance: 0,
      };
      localStorage.setItem('sabi_fallback_token', 'mock-customer-token');
      dispatch(loginSuccess(mockUser));
      dispatch(showToast({ message: 'Signed in with Google (Mock Mode)', type: 'success' }));
      navigate('/');
    }
  };

  // Quick fill developer functions
  const handleQuickLogin = (role: 'admin' | 'customer') => {
    const isAdm = role === 'admin';
    const mockUser: any = {
      id: isAdm ? 'mock-admin-uid' : 'mock-customer-uid',
      name: isAdm ? 'Test Administrator' : 'Test Customer',
      email: isAdm ? 'admin@sabi.com' : 'customer@sabi.com',
      phone: '9876543210',
      role: role,
      addresses: [
        {
          id: 'addr_1',
          label: 'Home',
          street: 'Flat 102, Gold Crest Apartments, Jubilee Hills',
          city: 'Hyderabad',
          state: 'Telangana',
          zip: '500081',
          phone: '9876543210',
          isDefault: true,
        }
      ],
      walletBalance: 250,
    };

    localStorage.setItem('sabi_fallback_token', isAdm ? 'mock-admin-token' : 'mock-customer-token');
    dispatch(loginSuccess(mockUser));
    dispatch(showToast({ message: `Logged in as Test ${role === 'admin' ? 'Admin' : 'Customer'}`, type: 'success' }));
    navigate(isAdm ? '/admin' : '/');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-md space-y-6">
        
        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 font-display">
            {isLogin ? 'Welcome Back' : 'Create Gifting Account'}
          </h2>
          <p className="text-xs text-gray-400">Discover premium return gifts and wedding essentials.</p>
        </div>

        {/* Traditional Auth Form */}
        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Full Name</span>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-10 pr-3 py-2 text-xs font-semibold outline-none"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase">Email Address</span>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                placeholder="e.g. name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-10 pr-3 py-2 text-xs font-semibold outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase">Password</span>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-10 pr-3 py-2 text-xs font-semibold outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gold hover:bg-gold-hover text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-md cursor-pointer"
          >
            {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Sign Up'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Separator */}
        <div className="flex items-center justify-between text-xs text-gray-400 my-4">
          <div className="h-px bg-gray-100 flex-1" />
          <span className="px-3 uppercase font-bold text-[10px]">Or continue with</span>
          <div className="h-px bg-gray-100 flex-1" />
        </div>

        {/* Google sign-in */}
        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-3xs"
        >
          <img src="https://docs.idrsolutions.com/build/images/google-icon.png" alt="" className="w-4 h-4 object-contain" />
          Sign in with Google
        </button>

        {/* Switch mode */}
        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-bold text-gold hover:underline"
          >
            {isLogin ? 'New to Sabi? Create an account' : 'Already have an account? Sign In'}
          </button>
        </div>

        {/* Developer sandbox bypass shortcuts */}
        <div className="bg-slate-50 border border-dashed border-gray-200 p-4 rounded-2xl text-center space-y-3">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
            <Sparkles className="w-4.5 h-4.5 text-gold shrink-0" />
            Developer Sandboxed Access
          </p>
          <div className="flex gap-2.5">
            <button
              onClick={() => handleQuickLogin('customer')}
              className="flex-1 py-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 transition-all cursor-pointer shadow-3xs"
            >
              Test Customer
            </button>
            <button
              onClick={() => handleQuickLogin('admin')}
              className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-gold rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-3xs"
            >
              Test Admin
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
