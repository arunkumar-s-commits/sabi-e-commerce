import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { apiRequest } from '../services/api';
import { updateUserAddresses } from '../store/slices/authSlice';
import { showToast } from '../store/slices/uiSlice';
import { User, ShoppingBag, MapPin, Ticket, LifeBuoy, Wallet, Plus, Trash2, CheckCircle2, ChevronRight, FileText, Send } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();

  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  
  // Dashboard Tabs: profile, orders, addresses, coupons, tickets
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'coupons' | 'tickets'>(
    (searchParams.get('tab') as any) || 'profile'
  );

  // States
  const [orders, setOrders] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Address Modal form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrZip, setAddrZip] = useState('');
  const [addrPhone, setAddrPhone] = useState(user?.phone || '');

  // Support ticket state
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  // Load orders history
  useEffect(() => {
    if (activeTab === 'orders' && isAuthenticated) {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const res = await apiRequest('/orders/my-orders');
          if (res.success) {
            setOrders(res.data);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [activeTab, isAuthenticated]);

  // Load coupons list
  useEffect(() => {
    if (activeTab === 'coupons' && isAuthenticated) {
      const fetchCoupons = async () => {
        try {
          const res = await apiRequest('/coupons');
          if (res.success) {
            setCoupons(res.data);
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchCoupons();
    }
  }, [activeTab, isAuthenticated]);

  // Handle address addition
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrStreet || !addrCity || !addrState || !addrZip || !addrPhone) {
      dispatch(showToast({ message: 'Fill out all address fields', type: 'error' }));
      return;
    }

    try {
      const res = await apiRequest('/auth/addresses', {
        method: 'POST',
        data: {
          label: addrLabel,
          street: addrStreet,
          city: addrCity,
          state: addrState,
          zip: addrZip,
          phone: addrPhone,
        },
      });

      if (res.success) {
        dispatch(updateUserAddresses(res.data));
        dispatch(showToast({ message: 'Address saved to profile', type: 'success' }));
        setShowAddressForm(false);
        // Reset fields
        setAddrStreet('');
        setAddrCity('');
        setAddrState('');
        setAddrZip('');
      }
    } catch (err: any) {
      dispatch(showToast({ message: err.message, type: 'error' }));
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const res = await apiRequest(`/auth/addresses/${id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        dispatch(updateUserAddresses(res.data));
        dispatch(showToast({ message: 'Address removed from profile', type: 'success' }));
      }
    } catch (err: any) {
      dispatch(showToast({ message: err.message, type: 'error' }));
    }
  };

  // Submit Support Ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      dispatch(showToast({ message: 'Enter ticket subject and description details', type: 'error' }));
      return;
    }

    setSubmittingTicket(true);
    try {
      // Simulate submission endpoint sync
      const res = await apiRequest('/leads/corporate', { // reuse POST for simulated write
        method: 'POST',
        data: {
          companyName: 'Support Desk Ticket',
          contactPerson: user?.name,
          phone: user?.phone || '9876543210',
          quantity: 5,
          budget: 500,
          requirements: `[Subject: ${ticketSubject}] ${ticketMessage}`,
        },
      });

      if (res.success) {
        dispatch(showToast({ message: 'Support ticket submitted successfully!', type: 'success' }));
        setTickets([
          {
            id: `tkt_${Date.now()}`,
            subject: ticketSubject,
            message: ticketMessage,
            status: 'open',
            createdAt: new Date().toISOString(),
          },
          ...tickets,
        ]);
        setTicketSubject('');
        setTicketMessage('');
      }
    } catch (err: any) {
      dispatch(showToast({ message: err.message, type: 'error' }));
    } finally {
      setSubmittingTicket(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Sidebar navigation */}
        <aside className="space-y-4">
          
          {/* Welcome User widget */}
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-3xl text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold flex items-center justify-center mx-auto text-gold text-lg font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 capitalize leading-none">{user?.name}</h3>
              <span className="text-[10px] text-gray-400 font-semibold">{user?.email}</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex items-center justify-between text-xs text-gray-600 px-2 font-medium">
              <span className="flex items-center gap-1">
                <Wallet className="w-4 h-4 text-emerald-600" />
                Wallet Cash
              </span>
              <span className="font-bold text-gray-800">₹{user?.walletBalance || 0}</span>
            </div>
          </div>

          {/* Navigation Panel */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-3xs overflow-hidden flex flex-col">
            {[
              { id: 'profile', label: 'My Profile', icon: <User className="w-4 h-4" /> },
              { id: 'orders', label: 'My Orders', icon: <ShoppingBag className="w-4 h-4" /> },
              { id: 'addresses', label: 'Addresses', icon: <MapPin className="w-4 h-4" /> },
              { id: 'coupons', label: 'Gifting Coupons', icon: <Ticket className="w-4 h-4" /> },
              { id: 'tickets', label: 'Support Desk', icon: <LifeBuoy className="w-4 h-4" /> },
            ].map((nav) => (
              <button
                key={nav.id}
                onClick={() => setActiveTab(nav.id as any)}
                className={`flex items-center gap-3 px-5 py-3.5 text-xs font-bold transition-all text-left border-l-3 cursor-pointer ${
                  activeTab === nav.id
                    ? 'border-gold bg-gold/5 text-gold-hover'
                    : 'border-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                {nav.icon}
                {nav.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Right Side: Tab Contents panel */}
        <main className="lg:col-span-3 bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-3xs min-h-[450px]">
          
          {/* PROFILE DETAIL TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3">My Gifting Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm font-semibold">
                <div className="space-y-1 bg-slate-50 p-4 border border-gray-100 rounded-xl">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Account Name</span>
                  <p className="text-gray-800 capitalize">{user?.name}</p>
                </div>
                <div className="space-y-1 bg-slate-50 p-4 border border-gray-100 rounded-xl">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Registered Email</span>
                  <p className="text-gray-800">{user?.email}</p>
                </div>
                <div className="space-y-1 bg-slate-50 p-4 border border-gray-100 rounded-xl">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Contact Phone</span>
                  <p className="text-gray-800">{user?.phone || 'Not configured yet'}</p>
                </div>
                <div className="space-y-1 bg-slate-50 p-4 border border-gray-100 rounded-xl">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Account Privilege</span>
                  <p className="text-gold font-bold uppercase">{user?.role} Portal</p>
                </div>
              </div>
            </div>
          )}

          {/* ORDERS HISTORY TIMELINE */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3">My Order History</h3>
              {loadingOrders && <div className="text-center text-xs py-8 text-gray-400">Loading order records...</div>}
              {!loadingOrders && orders.length === 0 && (
                <div className="text-center text-xs py-12 text-gray-400 font-medium">You haven't placed any orders yet.</div>
              )}
              
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div key={ord.id} className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-3xs">
                    
                    {/* Collapsed top bar details */}
                    <div
                      onClick={() => setExpandedOrderId(expandedOrderId === ord.id ? null : ord.id)}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer hover:bg-gray-50/50"
                    >
                      <div className="text-xs sm:text-sm font-semibold">
                        <span className="text-gray-400">ID: </span>
                        <strong className="text-gray-800 uppercase">{ord.id}</strong>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(ord.createdAt).toLocaleDateString()}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3.5">
                        <div className="text-xs sm:text-sm font-semibold text-right">
                          <span className="text-gray-400">Amount: </span>
                          <strong className="text-gold font-display">₹{ord.pricing?.total}</strong>
                        </div>
                        <span className={`text-[9px] font-bold uppercase px-3 py-1 rounded-full border ${
                          ord.status === 'delivered'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : ord.status === 'pending'
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        }`}>
                          {ord.status.replace('_', ' ')}
                        </span>
                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedOrderId === ord.id ? 'rotate-90' : ''}`} />
                      </div>
                    </div>

                    {/* Expanded details list */}
                    {expandedOrderId === ord.id && (
                      <div className="p-5 border-t border-gray-50 bg-slate-50/50 space-y-4 text-xs sm:text-sm font-medium">
                        
                        {/* Products */}
                        <div className="space-y-2">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ordered items</span>
                          {ord.items?.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-center bg-white p-3 border border-gray-100 rounded-xl">
                              <span className="text-gray-700 font-semibold">{item.title} <strong className="text-gold font-bold">x{item.qty}</strong></span>
                              <span className="text-gray-800 font-bold">₹{item.price * item.qty}</span>
                            </div>
                          ))}
                        </div>

                        {/* Addresses and shipping tracking */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div className="bg-white p-4 border border-gray-100 rounded-xl space-y-1">
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Shipping Destination</span>
                            <p className="text-gray-700 font-semibold capitalize font-display text-xs">{ord.shippingAddress?.label}</p>
                            <p className="text-gray-500 text-xs mt-1">{ord.shippingAddress?.street}</p>
                            <p className="text-gray-500 text-xs">{ord.shippingAddress?.city}, {ord.shippingAddress?.state} - {ord.shippingAddress?.zip}</p>
                          </div>
                          
                          <div className="bg-white p-4 border border-gray-100 rounded-xl space-y-1 flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] text-gray-400 font-bold uppercase">Carrier Tracking</span>
                              <p className="text-gray-800 text-xs font-semibold mt-1">
                                {ord.trackingNumber ? `Tracking No: ${ord.trackingNumber}` : 'Awaiting dispatch confirmation'}
                              </p>
                            </div>
                            <button
                              onClick={() => alert(`Invoice / Receipt downloaded for order: ${ord.id}`)}
                              className="text-xs text-gold font-bold hover:underline flex items-center gap-1.5 mt-2 self-start"
                            >
                              <FileText className="w-4.5 h-4.5" />
                              Download Invoice PDF
                            </button>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ADDRESS BOOK MANAGER */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900 uppercase tracking-widest">My Saved Addresses</h3>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="flex items-center gap-1 text-xs font-bold text-gold hover:underline cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Address
                </button>
              </div>

              {/* Add form */}
              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="bg-slate-50 border border-gray-100 rounded-2xl p-5 space-y-4 max-w-lg">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">New Shipping Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 col-span-2">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Address Label</span>
                      <select
                        value={addrLabel}
                        onChange={(e) => setAddrLabel(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                      >
                        <option value="Home">Home</option>
                        <option value="Office">Office</option>
                        <option value="Wedding Venue">Wedding Venue</option>
                      </select>
                    </div>

                    <div className="space-y-1 col-span-2">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Street Address</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 102, Gold Crest Plaza"
                        value={addrStreet}
                        onChange={(e) => setAddrStreet(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">City</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Hyderabad"
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">State</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Telangana"
                        value={addrState}
                        onChange={(e) => setAddrState(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Zip Code</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 500081"
                        maxLength={6}
                        value={addrZip}
                        onChange={(e) => setAddrZip(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Recipient Phone</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 9876543210"
                        value={addrPhone}
                        onChange={(e) => setAddrPhone(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase"
                    >
                      Save Address
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-bold uppercase"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Grid of existing addresses */}
              {user?.addresses && user.addresses.length === 0 && !showAddressForm && (
                <div className="text-center text-xs py-10 text-gray-400 font-medium">You haven't saved any addresses yet.</div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {user?.addresses?.map((addr: any) => (
                  <div key={addr.id} className="border border-gray-100 rounded-2xl p-4 flex flex-col justify-between hover:shadow-2xs transition-shadow">
                    <div className="text-xs sm:text-sm font-semibold space-y-1">
                      <span className="font-bold text-gray-800 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[8px] bg-emerald-50 text-emerald-600 font-bold border border-emerald-100 px-2 py-0.5 rounded-full uppercase ml-2">
                          Default
                        </span>
                      )}
                      <p className="text-gray-600 mt-2">{addr.street}</p>
                      <p className="text-gray-500 font-semibold">{addr.city}, {addr.state} - {addr.zip}</p>
                      <p className="text-gray-400 text-xs mt-1.5">Phone: {addr.phone}</p>
                    </div>

                    <div className="flex justify-end pt-3 border-t border-gray-50 mt-4">
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-bold cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVE COUPONS HUB */}
          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3">Available Promotions</h3>
              {coupons.length === 0 && (
                <div className="text-center text-xs py-12 text-gray-400 font-medium">No coupon codes are active right now. Check back later!</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {coupons.map((c) => (
                  <div key={c.code} className="border border-dashed border-gold/40 rounded-2xl p-4 bg-amber-50/10 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gold bg-gold/15 px-2.5 py-1 rounded-lg uppercase tracking-wider">{c.code}</span>
                      <h4 className="text-sm font-bold text-gray-800 mt-2">
                        {c.type === 'percentage'
                          ? `Flat ${c.value}% Off`
                          : c.type === 'flat'
                          ? `Save ₹${c.value} Instantly`
                          : 'Free Shipping Code'}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-medium">Min Order required: ₹{c.minOrderValue}</p>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-400 pt-2 border-t border-dashed border-gray-100">
                      <span>Expires: {new Date(c.expiryDate).toLocaleDateString()}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(c.code);
                          dispatch(showToast({ message: `Copied promo code: ${c.code}`, type: 'success' }));
                        }}
                        className="text-xs text-gold hover:underline font-bold"
                      >
                        Copy Code
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUPPORT TICKETS DESK */}
          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3">Help Desk / Support Tickets</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Tickets list */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Your Ticket History</h4>
                  {tickets.length === 0 && (
                    <div className="text-xs text-gray-400 py-6 text-center font-medium border border-gray-100 rounded-xl bg-slate-50/50">
                      No active support tickets.
                    </div>
                  )}
                  {tickets.map((t) => (
                    <div key={t.id} className="border border-gray-100 rounded-xl p-4 bg-white space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-800 truncate max-w-[150px]">{t.subject}</span>
                        <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          t.status === 'open' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-2">{t.message}</p>
                      <p className="text-[9px] text-gray-400 font-semibold">{new Date(t.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                {/* Create form */}
                <div className="bg-slate-50 border border-gray-100 p-5 rounded-2xl shadow-3xs space-y-4">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Raise a New Ticket</h4>
                  <form onSubmit={handleSubmitTicket} className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Subject</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Return Gift custom monogram request"
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Detailed Query</span>
                      <textarea
                        required
                        placeholder="Describe your issue or custom gift configuration specifications..."
                        rows={4}
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-medium outline-none resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingTicket}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-gold" />
                      Submit Ticket
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
