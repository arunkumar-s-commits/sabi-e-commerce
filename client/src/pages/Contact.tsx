import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useAppDispatch } from '../store';
import { showToast } from '../store/slices/uiSlice';
import { Mail, Phone, MapPin, Send, HelpCircle } from 'lucide-react';

export const Contact: React.FC = () => {
  const dispatch = useAppDispatch();

  const [cms, setCms] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCmsData = async () => {
      try {
        const res = await apiRequest('/settings/cms');
        if (res.success) {
          setCms(res.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCmsData();
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      dispatch(showToast({ message: 'Fill in all support form details', type: 'error' }));
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/leads/corporate', { // reuse POST for simulation
        method: 'POST',
        data: {
          companyName: 'Contact Us Support Request',
          contactPerson: name,
          phone: '9876543210',
          quantity: 1,
          budget: 100,
          requirements: `[Sender: ${email}] ${message}`,
        },
      });

      if (res.success) {
        dispatch(showToast({ message: 'Support query received successfully!', type: 'success' }));
        setName('');
        setEmail('');
        setMessage('');
      }
    } catch (err: any) {
      dispatch(showToast({ message: err.message, type: 'error' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      
      {/* Visual Title */}
      <div className="text-center space-y-2 max-w-xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-display">Contact Gifting Support</h2>
        <p className="text-xs sm:text-sm text-gray-500">Have questions about order customization, delivery tracking, or bulk quotes?</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Left Side: Contact details */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-2">Support Hotlines</h3>
            <div className="space-y-3.5 text-xs sm:text-sm text-gray-600 font-semibold">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gold shrink-0" />
                <span>{cms?.contactPhone || '+91 98765 43210'} (Mon - Sat, 9AM - 7PM)</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gold shrink-0" />
                <span>{cms?.contactEmail || 'support@sabireturngifts.com'}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <span>{cms?.address || '102, Gold Crest Plaza, Jubilee Hills, Hyderabad, India'}</span>
              </div>
            </div>
          </div>

          {/* Dynamic FAQ list */}
          {cms?.faqs && cms.faqs.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-2 flex items-center gap-2">
                <HelpCircle className="w-4.5 h-4.5 text-gold" />
                Frequently Asked Questions
              </h3>
              <div className="space-y-3">
                {cms.faqs.map((faq: any, idx: number) => (
                  <div key={idx} className="p-4 border border-gray-100 rounded-xl space-y-1.5 bg-white">
                    <p className="text-xs sm:text-sm font-bold text-gray-800">{faq.question}</p>
                    <p className="text-[11px] sm:text-xs text-gray-500 font-semibold">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Message form */}
        <div className="bg-slate-50 border border-gray-100 p-6 sm:p-8 rounded-3xl shadow-2xs space-y-4">
          <h3 className="text-base font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-3">Drop Us a Message</h3>
          
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Your Name</span>
              <input
                type="text"
                required
                placeholder="e.g. Anand Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Email Address</span>
              <input
                type="email"
                required
                placeholder="e.g. anand@outlook.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Message / Query Details</span>
              <textarea
                required
                placeholder="Write your custom monogram specifications or other help desk inquiries here..."
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-xs font-semibold outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-gold" />
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
