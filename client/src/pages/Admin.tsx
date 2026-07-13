import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { apiRequest } from '../services/api';
import { showToast } from '../store/slices/uiSlice';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { LayoutDashboard, Package, Tag, ShoppingCart, Star, HelpCircle, FileText, Plus, Trash2, Edit2, Check, X, ShieldAlert } from 'lucide-react';

export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  
  // Guard access
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      dispatch(showToast({ message: 'Administrative access required.', type: 'error' }));
      navigate('/');
    }
  }, [isAuthenticated, user, navigate, dispatch]);

  // Tab state
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'categories' | 'orders' | 'reviews' | 'leads' | 'cms'>('analytics');

  // Loaders
  const [analytics, setAnalytics] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [cms, setCms] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form states: Product Edit/Add Modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodTitle, setProdTitle] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState(199);
  const [prodCategory, setProdCategory] = useState('');
  const [prodStock, setProdStock] = useState(100);
  const [prodIsPremium, setProdIsPremium] = useState(false);
  const [prodIsBestSeller, setProdIsBestSeller] = useState(false);

  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');

  // CRM Leads Tracker note updates
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [leadNotes, setLeadNotes] = useState('');

  // CMS/Settings state variables
  const [aboutText, setAboutText] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');

  // Load Data depending on active tab
  useEffect(() => {
    if (user?.role !== 'admin') return;

    const loadAdminData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'analytics') {
          const res = await apiRequest('/analytics/dashboard');
          if (res.success) setAnalytics(res.data);
        } else if (activeTab === 'products') {
          const res = await apiRequest('/products');
          if (res.success) setProducts(res.data);
        } else if (activeTab === 'categories') {
          const res = await apiRequest('/categories');
          if (res.success) setCategories(res.data);
        } else if (activeTab === 'orders') {
          const res = await apiRequest('/orders/admin/all');
          if (res.success) setOrders(res.data);
        } else if (activeTab === 'reviews') {
          const res = await apiRequest('/reviews/admin');
          if (res.success) setReviews(res.data);
        } else if (activeTab === 'leads') {
          const res = await apiRequest('/leads/admin/all');
          if (res.success) setLeads(res.data);
        } else if (activeTab === 'cms') {
          const res = await apiRequest('/settings/cms');
          if (res.success) {
            setCms(res.data);
            setAboutText(res.data.aboutUs || '');
            setSupportEmail(res.data.contactEmail || '');
            setSupportPhone(res.data.contactPhone || '');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, [activeTab, user]);

  // Product actions
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle || !prodDesc || !prodCategory) {
      dispatch(showToast({ message: 'Complete title, description and category', type: 'error' }));
      return;
    }

    const payload = {
      title: prodTitle,
      description: prodDesc,
      price: Number(prodPrice),
      category: prodCategory,
      stock: Number(prodStock),
      isPremium: prodIsPremium,
      isBestSeller: prodIsBestSeller,
      images: ['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop'],
    };

    try {
      let res;
      if (editingProductId) {
        res = await apiRequest(`/products/${editingProductId}`, {
          method: 'PUT',
          data: payload,
        });
      } else {
        res = await apiRequest('/products', {
          method: 'POST',
          data: payload,
        });
      }

      if (res.success) {
        dispatch(showToast({ message: editingProductId ? 'Product updated!' : 'Product created!', type: 'success' }));
        setShowProductModal(false);
        setEditingProductId(null);
        // Refresh products list
        const listRes = await apiRequest('/products');
        if (listRes.success) setProducts(listRes.data);
      }
    } catch (err: any) {
      dispatch(showToast({ message: err.message, type: 'error' }));
    }
  };

  const handleEditProductClick = (prod: any) => {
    setEditingProductId(prod.id);
    setProdTitle(prod.title);
    setProdDesc(prod.description);
    setProdPrice(prod.price);
    setProdCategory(prod.category);
    setProdStock(prod.stock);
    setProdIsPremium(prod.isPremium || false);
    setProdIsBestSeller(prod.isBestSeller || false);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await apiRequest(`/products/${id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setProducts(products.filter((p) => p.id !== id));
        dispatch(showToast({ message: 'Product deleted successfully', type: 'success' }));
      }
    } catch (err: any) {
      dispatch(showToast({ message: err.message, type: 'error' }));
    }
  };

  // Category Actions
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatSlug) return;
    try {
      const res = await apiRequest('/categories', {
        method: 'POST',
        data: { name: newCatName, slug: newCatSlug },
      });
      if (res.success) {
        setCategories([...categories, res.data]);
        setNewCatName('');
        setNewCatSlug('');
        dispatch(showToast({ message: 'Category added!', type: 'success' }));
      }
    } catch (err: any) {
      dispatch(showToast({ message: err.message, type: 'error' }));
    }
  };

  const handleDeleteCategory = async (slug: string) => {
    if (!confirm('Delete category?')) return;
    try {
      const res = await apiRequest(`/categories/${slug}`, { method: 'DELETE' });
      if (res.success) {
        setCategories(categories.filter((c) => c.slug !== slug));
        dispatch(showToast({ message: 'Category deleted', type: 'success' }));
      }
    } catch (err: any) {
      dispatch(showToast({ message: err.message, type: 'error' }));
    }
  };

  // Order Updates
  const handleUpdateOrderStatus = async (id: string, currentStatus: string) => {
    const statuses = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];
    const currentIdx = statuses.indexOf(currentStatus);
    const nextStatus = statuses[Math.min(currentIdx + 1, statuses.length - 1)];

    if (nextStatus === currentStatus) return;

    try {
      const res = await apiRequest(`/orders/admin/${id}`, {
        method: 'PUT',
        data: { status: nextStatus, trackingNumber: `TRK_${Date.now()}` },
      });
      if (res.success) {
        setOrders(orders.map((o) => (o.id === id ? res.data : o)));
        dispatch(showToast({ message: `Order status moved to: ${nextStatus}`, type: 'success' }));
      }
    } catch (err: any) {
      dispatch(showToast({ message: err.message, type: 'error' }));
    }
  };

  // Review moderation
  const handleModerateReview = async (id: string, approved: boolean) => {
    try {
      const res = await apiRequest(`/reviews/admin/${id}`, {
        method: 'PUT',
        data: { approved },
      });
      if (res.success) {
        setReviews(reviews.map((r) => (r.id === id ? res.data : r)));
        dispatch(showToast({ message: approved ? 'Review Approved!' : 'Review status updated', type: 'success' }));
      }
    } catch (err: any) {
      dispatch(showToast({ message: err.message, type: 'error' }));
    }
  };

  // Lead updates
  const handleUpdateLead = async (id: string, type: string, currentStatus: string) => {
    const statuses = ['new', 'contacted', 'quoted', 'converted', 'lost'];
    const currentIdx = statuses.indexOf(currentStatus);
    const nextStatus = statuses[Math.min(currentIdx + 1, statuses.length - 1)];

    if (nextStatus === currentStatus) return;

    try {
      const res = await apiRequest(`/leads/admin/${type}/${id}`, {
        method: 'PUT',
        data: { status: nextStatus, notes: leadNotes || 'Status updated via CRM' },
      });
      if (res.success) {
        setLeads(leads.map((l) => (l.id === id ? { ...res.data, type } : l)));
        setEditingLeadId(null);
        setLeadNotes('');
        dispatch(showToast({ message: `Lead updated: ${nextStatus}`, type: 'success' }));
      }
    } catch (err: any) {
      dispatch(showToast({ message: err.message, type: 'error' }));
    }
  };

  // CMS update
  const handleSaveCmsSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/settings/cms', {
        method: 'PUT',
        data: {
          aboutUs: aboutText,
          contactEmail: supportEmail,
          contactPhone: supportPhone,
        },
      });
      if (res.success) {
        dispatch(showToast({ message: 'CMS Settings updated successfully', type: 'success' }));
      }
    } catch (err: any) {
      dispatch(showToast({ message: err.message, type: 'error' }));
    }
  };

  if (user?.role !== 'admin') return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 font-display flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-gold shrink-0" />
            Sabi Enterprise Administration
          </h2>
          <p className="text-xs text-gray-400 mt-1">Manage catalog updates, leads funnel CRM, order log timeline, and reviews.</p>
        </div>
      </div>

      {/* Admin layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        
        {/* Navigation */}
        <aside className="lg:col-span-1 bg-white border border-gray-100 rounded-2xl shadow-3xs overflow-hidden flex flex-col">
          {[
            { id: 'analytics', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
            { id: 'categories', label: 'Categories', icon: <Tag className="w-4 h-4" /> },
            { id: 'orders', label: 'Orders', icon: <ShoppingCart className="w-4 h-4" /> },
            { id: 'reviews', label: 'Reviews', icon: <Star className="w-4 h-4" /> },
            { id: 'leads', label: 'CRM Leads', icon: <FileText className="w-4 h-4" /> },
            { id: 'cms', label: 'CMS Config', icon: <HelpCircle className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-5 py-3.5 text-xs font-bold transition-all text-left border-l-3 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-gold bg-gold/5 text-gold-hover'
                  : 'border-transparent text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </aside>

        {/* Tab content wrapper */}
        <main className="lg:col-span-4 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-3xs min-h-[450px]">
          
          {/* ANALYTICS CHARTS */}
          {activeTab === 'analytics' && analytics && (
            <div className="space-y-8 animate-fade-in">
              <h3 className="text-base font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3">Financial Performance</h3>
              
              {/* KPIs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-gray-100 p-4 rounded-xl">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Total Revenue</span>
                  <p className="text-lg font-bold text-gold mt-1">₹{analytics.kpis?.totalRevenue}</p>
                </div>
                <div className="bg-slate-50 border border-gray-100 p-4 rounded-xl">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Total Orders</span>
                  <p className="text-lg font-bold text-gray-800 mt-1">{analytics.kpis?.totalOrders}</p>
                </div>
                <div className="bg-slate-50 border border-gray-100 p-4 rounded-xl">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Average Value</span>
                  <p className="text-lg font-bold text-gray-800 mt-1">₹{analytics.kpis?.avgOrderValue}</p>
                </div>
                <div className="bg-slate-50 border border-gray-100 p-4 rounded-xl">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Pending Orders</span>
                  <p className="text-lg font-bold text-amber-500 mt-1">{analytics.kpis?.pendingOrders}</p>
                </div>
              </div>

              {/* Recharts Graphs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Revenue Stream Timeline</h4>
                  <div className="h-64 bg-slate-50 p-4 border border-gray-100 rounded-2xl">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.charts?.monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2.5} dot={{ fill: '#D4AF37' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Top Gifting Items sold</h4>
                  <div className="h-64 bg-slate-50 p-4 border border-gray-100 rounded-2xl">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.charts?.topProducts}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="sales" fill="#2563EB" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* PRODUCT MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900 uppercase tracking-widest">Inventory Management</h3>
                <button
                  onClick={() => {
                    setEditingProductId(null);
                    setProdTitle('');
                    setProdDesc('');
                    setProdPrice(199);
                    setProdStock(100);
                    setProdIsPremium(false);
                    setProdIsBestSeller(false);
                    setShowProductModal(true);
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-gold hover:underline cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </button>
              </div>

              {/* Product form Modal overlay */}
              {showProductModal && (
                <div className="bg-slate-50 border border-gray-100 rounded-2xl p-5 space-y-4 max-w-lg">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    {editingProductId ? 'Edit catalog product' : 'Configure New Gifting Item'}
                  </h4>
                  <form onSubmit={handleProductSubmit} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 col-span-2">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Product Title</span>
                        <input
                          type="text"
                          required
                          value={prodTitle}
                          onChange={(e) => setProdTitle(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none"
                        />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Description</span>
                        <textarea
                          required
                          rows={3}
                          value={prodDesc}
                          onChange={(e) => setProdDesc(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs outline-none resize-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Price (₹)</span>
                        <input
                          type="number"
                          required
                          value={prodPrice}
                          onChange={(e) => setProdPrice(Number(e.target.value))}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Stock Count</span>
                        <input
                          type="number"
                          required
                          value={prodStock}
                          onChange={(e) => setProdStock(Number(e.target.value))}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none"
                        />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Category Category</span>
                        <select
                          value={prodCategory}
                          onChange={(e) => setProdCategory(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none text-gray-500"
                        >
                          <option value="">Select Category</option>
                          <option value="return-gifts">Return Gifts</option>
                          <option value="wedding-essentials">Wedding Essentials</option>
                          <option value="corporate-gifts">Corporate Gifts</option>
                          <option value="hampers">Hampers</option>
                          <option value="personalized-gifts">Personalized Gifts</option>
                        </select>
                      </div>
                      <div className="flex gap-4 col-span-2 py-1">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={prodIsPremium} onChange={() => setProdIsPremium(!prodIsPremium)} className="accent-gold w-4 h-4" />
                          <span>Premium luxury tag</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={prodIsBestSeller} onChange={() => setProdIsBestSeller(!prodIsBestSeller)} className="accent-gold w-4 h-4" />
                          <span>Bestseller badge</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase">Save Product</button>
                      <button type="button" onClick={() => setShowProductModal(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold uppercase">Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Items Grid list */}
              <div className="space-y-2">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0]} className="w-10 h-10 object-cover rounded-lg bg-gray-50 shrink-0" />
                      <div>
                        <h4 className="text-gray-800 font-bold line-clamp-1">{p.title}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">Price: ₹{p.price} | Stock: {p.stock}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditProductClick(p)} className="p-1.5 text-gray-400 hover:text-gold transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CATEGORIES MANAGEMENT */}
          {activeTab === 'categories' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-base font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3">Configure Shop Categories</h3>
              
              {/* Category creation */}
              <form onSubmit={handleAddCategory} className="flex flex-wrap gap-3 bg-slate-50 border border-gray-100 rounded-xl p-4 max-w-xl">
                <input
                  type="text"
                  required
                  placeholder="Category Name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none"
                />
                <input
                  type="text"
                  required
                  placeholder="Slug (e.g. hampers)"
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none"
                />
                <button type="submit" className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase">Add</button>
              </form>

              {/* List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                {categories.map((c) => (
                  <div key={c.slug} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl text-xs sm:text-sm font-semibold">
                    <span className="text-gray-800 font-bold">{c.name} ({c.slug})</span>
                    <button onClick={() => handleDeleteCategory(c.slug)} className="text-gray-300 hover:text-rose-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ORDER SHIPPINGS */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-base font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3">Client Orders log</h3>
              <div className="space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="border border-gray-100 rounded-xl p-4 space-y-2 text-xs sm:text-sm font-semibold">
                    <div className="flex justify-between items-center text-xs">
                      <span>ID: <strong className="uppercase">{o.id}</strong> (User: {o.customerName})</span>
                      <span className={`px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase ${
                        o.status === 'delivered' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                      }`}>{o.status}</span>
                    </div>
                    
                    <div className="flex justify-between items-baseline pt-2">
                      <p className="text-gray-500 font-medium">Items count: {o.items?.length || 0} | Total: ₹{o.pricing?.total}</p>
                      {o.status !== 'delivered' && o.status !== 'cancelled' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(o.id, o.status)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-gold rounded-lg text-[10px] uppercase font-bold"
                        >
                          Step Status
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REVIEW MODERATION */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-base font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3">Review Moderation Queue</h3>
              <div className="space-y-3">
                {reviews.map((r) => (
                  <div key={r.id} className="border border-gray-100 rounded-xl p-4 bg-white space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-800">{r.userName} ({r.rating}★)</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full text-[8px] uppercase ${
                        r.approved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>{r.approved ? 'Approved' : 'Pending'}</span>
                    </div>
                    <p className="text-gray-500 font-semibold italic">"{r.comment}"</p>
                    
                    {!r.approved && (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleModerateReview(r.id, true)} className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold border border-emerald-200 px-2 py-1 rounded-lg bg-emerald-50"><Check className="w-3.5 h-3.5" /> Approve</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CRM LEADS PIPELINE */}
          {activeTab === 'leads' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-base font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3">CRM leads & bulk queries</h3>
              <div className="space-y-4">
                {leads.map((l) => (
                  <div key={l.id} className="border border-gray-100 rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                      <div>
                        <span className="font-bold text-gray-800 text-sm">{l.name || l.companyName}</span>
                        <span className="ml-2 text-[9px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase">{l.type} lead</span>
                      </div>
                      
                      <span className={`px-2.5 py-0.5 rounded-full border text-[8px] font-bold uppercase ${
                        l.status === 'converted' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-blue-50 border-blue-200 text-blue-700'
                      }`}>{l.status}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-gray-500 font-semibold leading-relaxed">
                      <p><strong>Phone:</strong> {l.phone} {l.email ? `| Email: ${l.email}` : ''}</p>
                      <p><strong>Quantity:</strong> {l.quantity} sets | Budget: ₹{l.budget}</p>
                      <p className="col-span-2"><strong>Notes:</strong> {l.notes || 'None recorded'}</p>
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-gray-50">
                      {editingLeadId === l.id ? (
                        <div className="flex gap-2 w-full max-w-sm items-center">
                          <input
                            type="text"
                            placeholder="Add notes..."
                            value={leadNotes}
                            onChange={(e) => setLeadNotes(e.target.value)}
                            className="flex-1 bg-slate-50 border border-gray-200 rounded-lg px-2 py-1 outline-none text-xs"
                          />
                          <button onClick={() => handleUpdateLead(l.id, l.type, l.status)} className="p-1 text-emerald-600 border border-emerald-100 bg-emerald-50 rounded-lg"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingLeadId(null)} className="p-1 text-rose-500 border border-rose-100 bg-rose-50 rounded-lg"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => { setEditingLeadId(l.id); setLeadNotes(l.notes || ''); }} className="text-slate-400 hover:text-gold font-bold">Edit notes</button>
                          {l.status !== 'converted' && l.status !== 'lost' && (
                            <button onClick={() => handleUpdateLead(l.id, l.type, l.status)} className="text-slate-700 hover:text-slate-900 font-bold">Stage status</button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CMS CONFIG */}
          {activeTab === 'cms' && cms && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-base font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3">CMS Page parameters</h3>
              
              <form onSubmit={handleSaveCmsSettings} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">About Brand Text</span>
                  <textarea
                    rows={4}
                    value={aboutText}
                    onChange={(e) => setAboutText(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Customer Support Email</span>
                    <input
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 outline-none"
                    />
                  </div>
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Customer Hotline Phone</span>
                    <input
                      type="text"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 outline-none"
                    />
                  </div>
                </div>

                <button type="submit" className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-gold rounded-xl font-bold uppercase">Save CMS Changes</button>
              </form>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
