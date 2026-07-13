import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ShieldCheck, Heart } from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* Trust Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-b border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div className="flex flex-col items-center space-y-1">
          <ShieldCheck className="w-6 h-6 text-gold" />
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest">Secure Payments</h4>
          <p className="text-[10px] text-slate-400">Cards, UPI, Netbanking & COD</p>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <div className="text-gold font-bold text-base font-display">10,000+</div>
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest">Happy Customers</h4>
          <p className="text-[10px] text-slate-400">Smiles delivered across celebrations</p>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <div className="text-gold font-bold text-base font-display">500+</div>
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest">Gift Styles</h4>
          <p className="text-[10px] text-slate-400">Handcrafted design collections</p>
        </div>
        <div className="flex flex-col items-center space-y-1">
          <div className="text-gold font-bold text-base font-display">PAN India</div>
          <h4 className="text-xs font-bold text-slate-100 uppercase tracking-widest">Express Shipping</h4>
          <p className="text-[10px] text-slate-400">Safely packed & tracked orders</p>
        </div>
      </div>

      {/* Primary Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Brand Details */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="w-14 h-14 rounded-full bg-white border-2 border-gold overflow-hidden flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105 shrink-0">
              <img src={logoImg} alt="SR" className="w-full h-full object-contain p-1" />
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="text-2xl sm:text-[1.8rem] font-semibold italic tracking-[0.02em] leading-none text-slate-100" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Sabi</h2>
              <p className="text-[10px] tracking-[0.2em] text-gold font-black mt-1 uppercase font-display">Return Gifts</p>
            </div>
          </Link>
          <p className="text-xs text-slate-400 leading-relaxed">
            Curating memories through elegant return gifts, premium wedding hampers, and personalized collections designed to elevate your celebrations.
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest">Shop Categories</h3>
          <ul className="space-y-2 text-xs text-slate-400 font-medium">
            <li><Link to="/shop?category=return-gifts" className="hover:text-gold transition-colors">Return Gifts</Link></li>
            <li><Link to="/shop?category=wedding-essentials" className="hover:text-gold transition-colors">Wedding Essentials</Link></li>
            <li><Link to="/shop?category=corporate-gifts" className="hover:text-gold transition-colors">Corporate Gifts</Link></li>
            <li><Link to="/shop?category=hampers" className="hover:text-gold transition-colors">Personalized Hampers</Link></li>
          </ul>
        </div>

        {/* Policies */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest">Support & Policies</h3>
          <ul className="space-y-2 text-xs text-slate-400 font-medium">
            <li><Link to="/contact" className="hover:text-gold transition-colors">Help Center / Contact Us</Link></li>
            <li><Link to="/terms-policies" className="hover:text-gold transition-colors">Terms of Service</Link></li>
            <li><Link to="/terms-policies" className="hover:text-gold transition-colors">Refund & Return Policy</Link></li>
            <li><Link to="/terms-policies" className="hover:text-gold transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest">Get In Touch</h3>
          <ul className="space-y-3 text-xs text-slate-400">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <span>102, Gold Crest Plaza, Jubilee Hills, Hyderabad, TS, India</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-gold shrink-0" />
              <span>+91 98765 43210</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-gold shrink-0" />
              <span>support@sabireturngifts.com</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Copyright Bar */}
      <div className="bg-slate-950 py-6 text-center text-xs text-slate-500 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gap-2">
        <p>© 2026 Sabi Return Gifts. All Rights Reserved. Crafted for celebrations.</p>
        <p className="flex items-center gap-1.5 justify-center">
          Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> in India
        </p>
      </div>
    </footer>
  );
};
