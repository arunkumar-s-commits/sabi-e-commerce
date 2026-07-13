import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleCart, toggleSearch, toggleMobileMenu, setMobileMenuOpen } from '../../store/slices/uiSlice';
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronDown, Award, Gift, Sparkles, Briefcase, Home, Box, Layers } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { logoutSuccess } from '../../store/slices/authSlice';
import logoImg from '../../assets/logo.png';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const cartItemsCount = useAppSelector((state) => state.cart.items.reduce((sum, item) => sum + item.qty, 0));
  const wishlistCount = useAppSelector((state) => state.wishlist.items.length);
  const isMobileMenuOpen = useAppSelector((state) => state.ui.isMobileMenuOpen);

  const [activeDropdown, setActiveDropdown] = useState<'shop' | 'returns' | 'wedding' | 'corporate' | null>(null);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      dispatch(logoutSuccess());
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigation = (path: string) => {
    setActiveDropdown(null);
    dispatch(setMobileMenuOpen(false));
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-[90] w-full glass-premium shadow-xs transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Mobile Menu Trigger */}
        <button
          onClick={() => dispatch(toggleMobileMenu())}
          className='lg:hidden p-2 text-gray-600 hover:text-gold transition-colors'
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3.5 group" onClick={() => setActiveDropdown(null)}>
          <div className="w-16 h-16 rounded-full bg-white border-2 border-gold overflow-hidden flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105 shrink-0">
            <img src={logoImg} alt="SR" className="w-full h-full object-contain p-1.5" />
          </div>

          <div className="flex flex-col justify-center">
            <h1 className="text-3xl sm:text-[2.2rem] font-semibold italic tracking-[0.02em] leading-none text-slate-950" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Sabi</h1>
            <p className="text-[10px] tracking-[0.2em] text-gold font-black mt-1 uppercase font-display">Return Gifts</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8 h-full">
          <Link to='/' className='text-sm font-semibold text-gray-700 hover:text-gold transition-colors'>Home</Link>

          {/* Shop Mega Menu */}
          <div
            className="relative h-full flex items-center"
            onMouseEnter={() => setActiveDropdown('shop')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gold transition-colors h-full cursor-pointer">
              Shop
              <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === 'shop' ? 'rotate-180' : ''}`} />
            </button>

            {activeDropdown === 'shop' && (
              <div className="absolute top-[76px] left-0 w-64 bg-white border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-2xl py-3 animate-fade-in z-50">
                <ul className="flex flex-col space-y-0.5">
                  <li>
                    <button
                      onClick={() => handleNavigation('/shop?category=return-gifts')}
                      className="relative w-full flex items-center py-2.5 pl-6 pr-4 text-xs font-bold text-slate-700 hover:text-gold transition-all duration-200 text-left cursor-pointer group"
                    >
                      <span className="absolute left-3 w-[3px] h-0 bg-gold rounded-full transition-all duration-250 group-hover:h-4 opacity-0 group-hover:opacity-100" />
                      <span className="transform transition-all duration-200 group-hover:translate-x-1.5">Return Gifts</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavigation('/shop?category=favor-bags')}
                      className="relative w-full flex items-center py-2.5 pl-6 pr-4 text-xs font-bold text-slate-700 hover:text-gold transition-all duration-200 text-left cursor-pointer group"
                    >
                      <span className="absolute left-3 w-[3px] h-0 bg-gold rounded-full transition-all duration-250 group-hover:h-4 opacity-0 group-hover:opacity-100" />
                      <span className="transform transition-all duration-200 group-hover:translate-x-1.5">Favor Bags</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavigation('/shop?category=home-decor')}
                      className="relative w-full flex items-center py-2.5 pl-6 pr-4 text-xs font-bold text-slate-700 hover:text-gold transition-all duration-200 text-left cursor-pointer group"
                    >
                      <span className="absolute left-3 w-[3px] h-0 bg-gold rounded-full transition-all duration-250 group-hover:h-4 opacity-0 group-hover:opacity-100" />
                      <span className="transform transition-all duration-200 group-hover:translate-x-1.5">Home Decor</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavigation('/shop?category=hampers')}
                      className="relative w-full flex items-center py-2.5 pl-6 pr-4 text-xs font-bold text-slate-700 hover:text-gold transition-all duration-200 text-left cursor-pointer group"
                    >
                      <span className="absolute left-3 w-[3px] h-0 bg-gold rounded-full transition-all duration-250 group-hover:h-4 opacity-0 group-hover:opacity-100" />
                      <span className="transform transition-all duration-200 group-hover:translate-x-1.5">Hampers</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavigation('/shop?category=personalized-gifts')}
                      className="relative w-full flex items-center py-2.5 pl-6 pr-4 text-xs font-bold text-slate-700 hover:text-gold transition-all duration-200 text-left cursor-pointer group"
                    >
                      <span className="absolute left-3 w-[3px] h-0 bg-gold rounded-full transition-all duration-250 group-hover:h-4 opacity-0 group-hover:opacity-100" />
                      <span className="transform transition-all duration-200 group-hover:translate-x-1.5">Personalized Gifts</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavigation('/shop?category=combo-packs')}
                      className="relative w-full flex items-center py-2.5 pl-6 pr-4 text-xs font-bold text-slate-700 hover:text-gold transition-all duration-200 text-left cursor-pointer group"
                    >
                      <span className="absolute left-3 w-[3px] h-0 bg-gold rounded-full transition-all duration-250 group-hover:h-4 opacity-0 group-hover:opacity-100" />
                      <span className="transform transition-all duration-200 group-hover:translate-x-1.5">Combo Packs</span>
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Return Gifts Mega Menu */}
          <div
            className="relative h-full flex items-center"
            onMouseEnter={() => setActiveDropdown('returns')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-gold transition-colors h-full cursor-pointer">
              Return Gifts
              <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === 'returns' ? 'rotate-180' : ''}`} />
            </button>

            {activeDropdown === 'returns' && (
              <div className="absolute top-[76px] left-0 w-64 bg-white border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.12)] rounded-2xl py-3 animate-fade-in z-50">
                <ul className="flex flex-col space-y-0.5">
                  <li>
                    <button
                      onClick={() => handleNavigation('/shop?occasion=Wedding')}
                      className="relative w-full flex items-center py-2.5 pl-6 pr-4 text-xs font-bold text-slate-700 hover:text-gold transition-all duration-200 text-left cursor-pointer group"
                    >
                      <span className="absolute left-3 w-[3px] h-0 bg-gold rounded-full transition-all duration-250 group-hover:h-4 opacity-0 group-hover:opacity-100" />
                      <span className="transform transition-all duration-200 group-hover:translate-x-1.5">Wedding Returns</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavigation('/shop?occasion=Housewarming')}
                      className="relative w-full flex items-center py-2.5 pl-6 pr-4 text-xs font-bold text-slate-700 hover:text-gold transition-all duration-200 text-left cursor-pointer group"
                    >
                      <span className="absolute left-3 w-[3px] h-0 bg-gold rounded-full transition-all duration-250 group-hover:h-4 opacity-0 group-hover:opacity-100" />
                      <span className="transform transition-all duration-200 group-hover:translate-x-1.5">Housewarming Gifts</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavigation('/shop?occasion=Baby+Shower')}
                      className="relative w-full flex items-center py-2.5 pl-6 pr-4 text-xs font-bold text-slate-700 hover:text-gold transition-all duration-200 text-left cursor-pointer group"
                    >
                      <span className="absolute left-3 w-[3px] h-0 bg-gold rounded-full transition-all duration-250 group-hover:h-4 opacity-0 group-hover:opacity-100" />
                      <span className="transform transition-all duration-200 group-hover:translate-x-1.5">Baby Showers</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleNavigation('/shop?occasion=Festival')}
                      className="relative w-full flex items-center py-2.5 pl-6 pr-4 text-xs font-bold text-slate-700 hover:text-gold transition-all duration-200 text-left cursor-pointer group"
                    >
                      <span className="absolute left-3 w-[3px] h-0 bg-gold rounded-full transition-all duration-250 group-hover:h-4 opacity-0 group-hover:opacity-100" />
                      <span className="transform transition-all duration-200 group-hover:translate-x-1.5">Festival Hampers</span>
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <Link to="/wedding-essentials" className="text-sm font-semibold text-gray-700 hover:text-gold transition-colors">Wedding Essentials</Link>
          <Link to="/corporate-gifts" className="text-sm font-semibold text-gray-700 hover:text-gold transition-colors">Corporate Gifts</Link>
          <Link to="/contact" className="text-sm font-semibold text-gray-700 hover:text-gold transition-colors">Contact</Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Search Trigger */}
          <button
            onClick={() => dispatch(toggleSearch())}
            className="p-2 text-gray-600 hover:text-gold transition-colors rounded-full hover:bg-gray-50"
            title="Search products"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Wishlist */}
          <Link
            to="/dashboard?tab=wishlist"
            className="p-2 text-gray-600 hover:text-gold transition-colors relative rounded-full hover:bg-gray-50 hidden sm:block"
            title="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Bag */}
          <button
            onClick={() => dispatch(toggleCart())}
            className="p-2 text-gray-600 hover:text-gold transition-colors relative rounded-full hover:bg-gray-50"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gold text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartItemsCount}
              </span>
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="relative group">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to={user?.role === 'admin' ? '/admin' : '/dashboard'}
                  className="p-2 text-gray-600 hover:text-gold transition-colors rounded-full hover:bg-gray-50 flex items-center justify-center"
                  title="Dashboard"
                >
                  <User className="w-5 h-5 text-gold" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-xs font-bold text-gray-500 hover:text-rose-600 hidden md:block"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="p-2 text-gray-600 hover:text-gold transition-colors rounded-full hover:bg-gray-50 flex items-center justify-center"
                title="Login"
              >
                <User className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-[80px] left-0 w-full bg-white border-b border-gray-100 shadow-2xl flex flex-col p-6 space-y-4 animate-fade-in z-[80]">
          <Link
            to="/"
            onClick={() => dispatch(setMobileMenuOpen(false))}
            className="text-sm font-bold text-gray-800 hover:text-gold border-b border-gray-50 pb-2"
          >
            Home
          </Link>
          <Link
            to="/shop"
            onClick={() => dispatch(setMobileMenuOpen(false))}
            className="text-sm font-bold text-gray-800 hover:text-gold border-b border-gray-50 pb-2"
          >
            Shop All Collections
          </Link>
          <Link
            to="/wedding-essentials"
            onClick={() => dispatch(setMobileMenuOpen(false))}
            className="text-sm font-bold text-gray-800 hover:text-gold border-b border-gray-50 pb-2"
          >
            Wedding Essentials
          </Link>
          <Link
            to="/corporate-gifts"
            onClick={() => dispatch(setMobileMenuOpen(false))}
            className="text-sm font-bold text-gray-800 hover:text-gold border-b border-gray-50 pb-2"
          >
            Corporate Gifting
          </Link>
          <Link
            to="/contact"
            onClick={() => dispatch(setMobileMenuOpen(false))}
            className="text-sm font-bold text-gray-800 hover:text-gold border-b border-gray-50 pb-2"
          >
            Contact Support
          </Link>

          {isAuthenticated ? (
            <div className="space-y-2 pt-2">
              <Link
                to={user?.role === 'admin' ? '/admin' : '/dashboard'}
                onClick={() => dispatch(setMobileMenuOpen(false))}
                className="block text-center py-2.5 bg-gray-50 text-gold font-bold text-xs uppercase tracking-wider rounded-xl border border-gray-100"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={() => {
                  dispatch(setMobileMenuOpen(false));
                  handleLogout();
                }}
                className="w-full text-center py-2.5 bg-rose-50 text-rose-600 font-bold text-xs uppercase tracking-wider rounded-xl border border-rose-100"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              onClick={() => dispatch(setMobileMenuOpen(false))}
              className="block text-center py-2.5 bg-gold text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs"
            >
              Sign In / Sign Up
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
