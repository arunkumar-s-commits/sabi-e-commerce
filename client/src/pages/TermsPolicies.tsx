import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { ShieldAlert, BookOpen, Undo2 } from 'lucide-react';

export const TermsPolicies: React.FC = () => {
  const [cms, setCms] = useState<any>(null);

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Privacy Policy */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-3xs space-y-3">
        <h3 className="text-base font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-2.5">
          <ShieldAlert className="w-5 h-5 text-gold" />
          Privacy Policy
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
          {cms?.privacyPolicy || 'We respect your privacy. User personal data is only utilized for order fulfillment and payment verification via Razorpay security standards.'}
        </p>
      </section>

      {/* Terms of Service */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-3xs space-y-3">
        <h3 className="text-base font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-2.5">
          <BookOpen className="w-5 h-5 text-gold" />
          Terms of Service
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
          {cms?.terms || 'All purchases are subject to availability. Prices are inclusive of GST. Custom orders cannot be returned once production starts.'}
        </p>
      </section>

      {/* Return & Refund Policy */}
      <section className="bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-3xs space-y-3">
        <h3 className="text-base font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-2.5">
          <Undo2 className="w-5 h-5 text-gold" />
          Refund & Return Policy
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
          {cms?.refundPolicy || 'Returns are accepted within 7 days of delivery for non-customized products only if they arrive damaged. Replacement will be processed upon inspection.'}
        </p>
      </section>

    </div>
  );
};
