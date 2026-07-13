import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/common/Header';
import { CartSidebar } from './components/common/CartSidebar';
import { SearchModal } from './components/common/SearchModal';
import { Toast } from './components/common/Toast';
import { Footer } from './components/common/Footer';

// Pages
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Dashboard } from './pages/Dashboard';
import { Admin } from './pages/Admin';
import { Auth } from './pages/Auth';
import { Contact } from './pages/Contact';
import { WeddingEssentials } from './pages/WeddingEssentials';
import { CorporateGifts } from './pages/CorporateGifts';
import { TermsPolicies } from './pages/TermsPolicies';

// Scroll to top on route change helper
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen bg-white">
        
        {/* Global Nav & Overlays */}
        <Header />
        <CartSidebar />
        <SearchModal />
        <Toast />

        {/* Dynamic Page Views */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/wedding-essentials" element={<WeddingEssentials />} />
            <Route path="/corporate-gifts" element={<CorporateGifts />} />
            <Route path="/terms-policies" element={<TermsPolicies />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <Footer />
      </div>
    </Router>
  );
};

export default App;
