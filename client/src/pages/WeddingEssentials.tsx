import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import { useAppDispatch } from '../store';
import { showToast } from '../store/slices/uiSlice';
import { Sparkles, Calendar, Gift, Users, Heart, ClipboardCheck } from 'lucide-react';

export const WeddingEssentials: React.FC = () => {
  const dispatch = useAppDispatch();

  // Inquiry form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [quantity, setQuantity] = useState('50');
  const [budget, setBudget] = useState('200');
  const [productPreference, setProductPreference] = useState('Tambulam Bags');
  const [submitting, setSubmitting] = useState(false);
  const [inquiryPlaced, setInquiryPlaced] = useState(false);

  const handleWeddingInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !eventDate || !quantity || !budget) {
      dispatch(showToast({ message: 'Please complete all required fields', type: 'error' }));
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/leads/wedding', {
        method: 'POST',
        data: {
          name,
          phone,
          email,
          eventDate,
          quantity: Number(quantity),
          budget: Number(budget),
          productPreference,
        },
      });

      if (res.success) {
        setInquiryPlaced(true);
        dispatch(showToast({ message: 'Wedding Gifting inquiry received!', type: 'success' }));
        // Reset states
        setName('');
        setPhone('');
        setEventDate('');
      }
    } catch (err: any) {
      dispatch(showToast({ message: err.message, type: 'error' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-16 pb-20 pt-8">
      
      {/* Visual Header Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden min-h-[350px] flex items-center p-8 sm:p-12">
          <img
            src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1200&auto=format&fit=crop"
            alt="Wedding gifts catalog header"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"></div>
          
          <div className="relative z-10 max-w-xl space-y-4 text-white">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/30 text-gold font-bold text-xs uppercase tracking-wider border border-gold/40">
              <Sparkles className="w-3.5 h-3.5" />
              Royal Wedding Favors
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display text-white">
              Celebrate Love with Heritage Gifting
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Explore traditional silk tambulam drawstrings, premium box compartments, bridal hampers, and customized packaging created to honor your guests.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Collections Gallery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            title: 'Zari Tambulam Bags',
            desc: 'Venezia raw silk potlis styled with heavy threadworks and double drawstrings. Compliments betel nut favors.',
            image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=500&auto=format&fit=crop',
          },
          {
            title: 'Bridal Gift Chests',
            desc: 'Velvet coated wooden chests containing minakari boxes, perfume diffusers, and customized thank you card tags.',
            image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=500&auto=format&fit=crop',
          },
          {
            title: 'Mehendi Return Favors',
            desc: 'Small decorative hand-painted brass bowls, candle holders, and organic potpourri packets packaged in matching bags.',
            image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=500&auto=format&fit=crop',
          },
        ].map((col, idx) => (
          <div key={idx} className="border border-gray-100 rounded-2xl overflow-hidden shadow-3xs bg-white">
            <img src={col.image} alt={col.title} className="w-full h-48 object-cover" />
            <div className="p-5 space-y-2">
              <h3 className="text-base font-bold text-gray-800">{col.title}</h3>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">{col.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Interactive Inquiry form & planner */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 border border-gray-100 rounded-3xl p-6 sm:p-10 shadow-2xs">
          {inquiryPlaced ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto border border-emerald-100 animate-bounce-short">
                <ClipboardCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Wedding Inquiry Registered!</h3>
                <p className="text-xs text-gray-400 mt-1">Our dedicated wedding gifting consultant will contact you via phone within 24 hours.</p>
              </div>
              <button
                onClick={() => setInquiryPlaced(false)}
                className="px-6 py-2 bg-slate-900 text-gold rounded-lg text-xs font-bold uppercase transition-colors"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              
              {/* Left Side detail specs */}
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] bg-gold/15 text-gold-hover font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Inquiry Planner</span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900">Wedding Return Gifts Consultation</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    Plan custom monograms, select custom color coordinates, and request sample sets. Submit details and get bulk catalog quotations.
                  </p>
                </div>

                <div className="space-y-4 text-xs text-gray-600 font-semibold">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gold shrink-0" />
                    <span>Complimentary Monogram customization on orders above 100 sets</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Gift className="w-5 h-5 text-gold shrink-0" />
                    <span>Get physical sample prototypes before bulk order confirmation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gold shrink-0" />
                    <span>Dedicated consultant assistance for design color coordinate mapping</span>
                  </div>
                </div>
              </div>

              {/* Inquiry fields */}
              <form onSubmit={handleWeddingInquirySubmit} className="space-y-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Name</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priyanjali Sen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Contact Phone</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                    />
                  </div>
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Email (Optional)</span>
                    <input
                      type="email"
                      placeholder="e.g. name@host.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Wedding Event Date</span>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Estimated Quantity</span>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-500 outline-none"
                    >
                      <option value="50">50 - 100 items</option>
                      <option value="150">100 - 250 items</option>
                      <option value="350">250 - 500 items</option>
                      <option value="750">500+ items</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Estimated Budget Per Gift</span>
                    <select
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-500 outline-none"
                    >
                      <option value="150">Under ₹199</option>
                      <option value="250">₹200 - ₹349</option>
                      <option value="450">₹350 - ₹499</option>
                      <option value="850">₹500 - ₹999</option>
                      <option value="1500">₹1000+</option>
                    </select>
                  </div>
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Gift Preference</span>
                    <select
                      value={productPreference}
                      onChange={(e) => setProductPreference(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-500 outline-none"
                    >
                      <option value="Tambulam Bags">Tambulam Potli Bags</option>
                      <option value="Brass Bowls">Heritage Brass Bowls</option>
                      <option value="Hampers">Luxury Combo Hampers</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-gold hover:text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center transition-colors cursor-pointer"
                >
                  {submitting ? 'Registering...' : 'Request Consultation'}
                </button>
              </form>

            </div>
          )}
        </div>
      </section>

    </div>
  );
};
