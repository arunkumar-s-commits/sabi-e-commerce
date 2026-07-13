import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import { useAppDispatch } from '../store';
import { showToast } from '../store/slices/uiSlice';
import { Sparkles, Briefcase, FileText, CheckCircle2, Trophy, ClipboardCheck } from 'lucide-react';

export const CorporateGifts: React.FC = () => {
  const dispatch = useAppDispatch();

  // Corporate Inquiry form state
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [quantity, setQuantity] = useState('20');
  const [budget, setBudget] = useState('500');
  const [requirements, setRequirements] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inquiryPlaced, setInquiryPlaced] = useState(false);

  const handleCorporateInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !contactPerson || !phone || !requirements) {
      dispatch(showToast({ message: 'Please complete all required fields', type: 'error' }));
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/leads/corporate', {
        method: 'POST',
        data: {
          companyName,
          contactPerson,
          phone,
          email,
          gstNumber,
          quantity: Number(quantity),
          budget: Number(budget),
          requirements,
        },
      });

      if (res.success) {
        setInquiryPlaced(true);
        dispatch(showToast({ message: 'Corporate Inquiry successfully registered!', type: 'success' }));
        // Reset
        setCompanyName('');
        setContactPerson('');
        setPhone('');
        setRequirements('');
      }
    } catch (err: any) {
      dispatch(showToast({ message: err.message, type: 'error' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-16 pb-20 pt-8">
      
      {/* Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden min-h-[350px] flex items-center p-8 sm:p-12">
          <img
            src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=1200&auto=format&fit=crop"
            alt="Corporate Gifting banner header"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"></div>
          
          <div className="relative z-10 max-w-xl space-y-4 text-white">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/30 text-gold font-bold text-xs uppercase tracking-wider border border-gold/40">
              <Briefcase className="w-3.5 h-3.5" />
              Enterprise Solutions
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display text-white">
              Corporate Gifting & Custom Logo Hampers
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Elevate customer relations and employee onboarding. Fully customized executive desk kits, premium dry fruit chests, and luxury stationery boxes.
            </p>
          </div>
        </div>
      </section>

      {/* Corporate Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
        <div className="p-6 border border-gray-100 rounded-2xl bg-white shadow-3xs space-y-2">
          <Trophy className="w-8 h-8 text-gold mx-auto" />
          <h4 className="text-sm font-bold text-gray-800 uppercase">Logo Branding</h4>
          <p className="text-xs text-gray-500 font-medium">Get custom laser engravings or gold-foil embossing of your company logo on hampers.</p>
        </div>
        <div className="p-6 border border-gray-100 rounded-2xl bg-white shadow-3xs space-y-2">
          <FileText className="w-8 h-8 text-gold mx-auto" />
          <h4 className="text-sm font-bold text-gray-800 uppercase">GST Input Billing</h4>
          <p className="text-xs text-gray-500 font-medium">Receive standard corporate GST tax invoices for business expense calculations.</p>
        </div>
        <div className="p-6 border border-gray-100 rounded-2xl bg-white shadow-3xs space-y-2">
          <CheckCircle2 className="w-8 h-8 text-gold mx-auto" />
          <h4 className="text-sm font-bold text-gray-800 uppercase">Bulk Logistics</h4>
          <p className="text-xs text-gray-500 font-medium">Single shipment to headquarters or multi-location delivery directly to employee homes.</p>
        </div>
      </section>

      {/* Inquiry form */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 border border-gray-100 rounded-3xl p-6 sm:p-10 shadow-2xs">
          {inquiryPlaced ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto border border-emerald-100 animate-bounce-short">
                <ClipboardCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Corporate Inquiry Registered!</h3>
                <p className="text-xs text-gray-400 mt-1">Our manager will reach out via email with our custom corporate catalog within 24 hours.</p>
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
              
              {/* Info columns */}
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] bg-gold/15 text-gold-hover font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Enterprise Catalog</span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900">Request Bulk Quotation</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">
                    Please submit your estimated employee counts and pricing preferences. Our design team will compile sample configurations tailored to your budget constraints.
                  </p>
                </div>
                
                <div className="bg-white p-4 border border-gray-100 rounded-xl space-y-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Volume Discounts:</span>
                  <ul className="text-xs text-gray-600 font-semibold space-y-1.5">
                    <li>• Orders above 25 sets: 5% discount</li>
                    <li>• Orders above 50 sets: 10% discount + logo</li>
                    <li>• Orders above 100 sets: Custom tiered discount</li>
                  </ul>
                </div>
              </div>

              {/* Form fields */}
              <form onSubmit={handleCorporateInquirySubmit} className="space-y-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Company Name</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corporation Pvt Ltd"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Contact Person</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suresh Patel"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                    />
                  </div>
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Phone Number</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Corporate Email</span>
                    <input
                      type="email"
                      required
                      placeholder="e.g. contact@acme.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                    />
                  </div>
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">GSTIN (Optional)</span>
                    <input
                      type="text"
                      placeholder="e.g. 36AAAAA1111A1Z1"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Target Quantity</span>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-500 outline-none"
                    >
                      <option value="20">20 - 50 sets</option>
                      <option value="75">50 - 150 sets</option>
                      <option value="250">150 - 500 sets</option>
                      <option value="750">500+ sets</option>
                    </select>
                  </div>
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Estimated Unit Budget</span>
                    <select
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-500 outline-none"
                    >
                      <option value="350">Under ₹499</option>
                      <option value="750">₹500 - ₹999</option>
                      <option value="1250">₹1000 - ₹1999</option>
                      <option value="2500">₹2000+</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Gifting Requirements</span>
                  <textarea
                    required
                    placeholder="Describe target occasion (employee recognition, Diwali gifts, client hampers), color palette, etc."
                    rows={3}
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl p-3 text-xs font-semibold outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-gold hover:text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center transition-colors cursor-pointer"
                >
                  {submitting ? 'Registering...' : 'Submit Quote Request'}
                </button>
              </form>

            </div>
          )}
        </div>
      </section>

    </div>
  );
};
