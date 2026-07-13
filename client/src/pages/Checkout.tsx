import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { clearCart } from '../store/slices/cartSlice';
import { showToast } from '../store/slices/uiSlice';
import { apiRequest } from '../services/api';
import { ChevronRight, ShieldCheck, CreditCard, CheckCircle, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const Checkout: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { items, giftWrapping, coupon, shippingCharge } = useAppSelector((state) => state.cart);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Address, 2: Payment, 3: Success Receipt
  
  // Address form fields
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    user?.addresses?.find((a: any) => a.isDefault)?.id || user?.addresses?.[0]?.id || ''
  );
  
  const [newAddrLabel, setNewAddrLabel] = useState('Home');
  const [newAddrStreet, setNewAddrStreet] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('');
  const [newAddrState, setNewAddrState] = useState('');
  const [newAddrZip, setNewAddrZip] = useState('');
  const [newAddrPhone, setNewAddrPhone] = useState(user?.phone || '');
  const [isAddingNewAddr, setIsAddingNewAddr] = useState(user?.addresses?.length === 0);

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState<'Razorpay' | 'COD'>('Razorpay');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Created Order Details for Receipt screen
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const giftWrapCharge = giftWrapping ? 30 : 0;
  
  let discount = 0;
  if (coupon) {
    if (coupon.type === 'percentage') {
      discount = Math.round((subtotal * coupon.value) / 100);
    } else if (coupon.type === 'flat') {
      discount = coupon.value;
    }
  }

  const grandTotal = subtotal + shippingCharge + giftWrapCharge - discount;

  // Add Address Action
  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrStreet || !newAddrCity || !newAddrState || !newAddrZip || !newAddrPhone) {
      dispatch(showToast({ message: 'Please fill in all address details', type: 'error' }));
      return;
    }

    try {
      const res = await apiRequest('/auth/addresses', {
        method: 'POST',
        data: {
          label: newAddrLabel,
          street: newAddrStreet,
          city: newAddrCity,
          state: newAddrState,
          zip: newAddrZip,
          phone: newAddrPhone,
        },
      });

      if (res.success) {
        dispatch(showToast({ message: 'Address added successfully!', type: 'success' }));
        // Simulate profile update or reload local storage setup
        const addedAddr = res.data[res.data.length - 1];
        setSelectedAddressId(addedAddr.id);
        setIsAddingNewAddr(false);
        // Clear fields
        setNewAddrStreet('');
        setNewAddrCity('');
        setNewAddrState('');
        setNewAddrZip('');
      }
    } catch (err: any) {
      dispatch(showToast({ message: err.message, type: 'error' }));
    }
  };

  const handleNextToPayment = () => {
    if (!selectedAddressId && !isAddingNewAddr) {
      dispatch(showToast({ message: 'Please select a delivery address', type: 'info' }));
      return;
    }
    setStep(2);
  };

  // Complete Payment Flow
  const handleCompleteOrder = async () => {
    if (!isAuthenticated) {
      dispatch(showToast({ message: 'Authentication required. Please log in.', type: 'error' }));
      navigate('/auth');
      return;
    }

    setProcessingPayment(true);

    const activeAddress = user?.addresses?.find((a: any) => a.id === selectedAddressId) || {
      street: newAddrStreet,
      city: newAddrCity,
      state: newAddrState,
      zip: newAddrZip,
      phone: newAddrPhone,
      label: newAddrLabel,
    };

    try {
      // 1. Initialize Order Payment on Backend
      const initPaymentRes = await apiRequest('/orders/create-payment', {
        method: 'POST',
        data: {
          items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })),
          couponCode: coupon?.code,
          giftWrapping,
        },
      });

      if (!initPaymentRes.success) {
        throw new Error(initPaymentRes.error || 'Payment initialization failed');
      }

      const orderPaymentData = initPaymentRes.data;

      // 2. Perform online Razorpay checkout popup
      if (paymentMethod === 'Razorpay') {
        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded && !orderPaymentData.isMock) {
          throw new Error('Razorpay SDK failed to load. Check internet connectivity.');
        }

        // Handle Test/Mock Bypass for environments without keys
        if (orderPaymentData.isMock) {
          dispatch(showToast({ message: 'Entering test/mock payment gateway', type: 'info' }));
          
          const verifyRes = await apiRequest('/orders/verify-payment', {
            method: 'POST',
            data: {
              items: items.map((i) => ({
                productId: i.productId,
                variantId: i.variantId,
                qty: i.qty,
                price: i.price,
                title: i.title,
                image: i.image,
              })),
              shippingAddress: activeAddress,
              billingAddress: activeAddress,
              pricing: {
                subtotal,
                shipping: shippingCharge,
                giftWrapping: giftWrapCharge,
                discount,
                total: grandTotal,
              },
              paymentMethod: 'Razorpay',
              razorpayOrderId: orderPaymentData.orderId,
              razorpayPaymentId: `pay_mock_${Date.now()}`,
              razorpaySignature: 'mock_signature',
              giftWrapping,
              couponApplied: coupon?.code || '',
            },
          });

          if (verifyRes.success) {
            setPlacedOrder(verifyRes.data);
            dispatch(clearCart());
            setStep(3);
          } else {
            throw new Error(verifyRes.error || 'Order placement failed');
          }
          return;
        }

        // Live Razorpay options
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mock_key',
          amount: orderPaymentData.amount,
          currency: orderPaymentData.currency,
          name: 'Sabi Return Gifts',
          description: 'Secure payment transaction',
          order_id: orderPaymentData.orderId,
          handler: async (response: any) => {
            try {
              // 3. Verify Razorpay credentials on Server
              const verifyRes = await apiRequest('/orders/verify-payment', {
                method: 'POST',
                data: {
                  items: items.map((i) => ({
                    productId: i.productId,
                    variantId: i.variantId,
                    qty: i.qty,
                    price: i.price,
                    title: i.title,
                    image: i.image,
                  })),
                  shippingAddress: activeAddress,
                  billingAddress: activeAddress,
                  pricing: {
                    subtotal,
                    shipping: shippingCharge,
                    giftWrapping: giftWrapCharge,
                    discount,
                    total: grandTotal,
                  },
                  paymentMethod: 'Razorpay',
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  giftWrapping,
                  couponApplied: coupon?.code || '',
                },
              });

              if (verifyRes.success) {
                setPlacedOrder(verifyRes.data);
                dispatch(clearCart());
                setStep(3);
              } else {
                dispatch(showToast({ message: verifyRes.error || 'Verification failed', type: 'error' }));
              }
            } catch (vErr: any) {
              dispatch(showToast({ message: vErr.message, type: 'error' }));
            }
          },
          prefill: {
            name: user?.name,
            email: user?.email,
            contact: activeAddress.phone,
          },
          theme: {
            color: '#2563EB',
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Cash On Delivery option
        const verifyRes = await apiRequest('/orders/verify-payment', {
          method: 'POST',
          data: {
            items: items.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              qty: i.qty,
              price: i.price,
              title: i.title,
              image: i.image,
            })),
            shippingAddress: activeAddress,
            billingAddress: activeAddress,
            pricing: {
              subtotal,
              shipping: shippingCharge,
              giftWrapping: giftWrapCharge,
              discount,
              total: grandTotal,
            },
            paymentMethod: 'COD',
            giftWrapping,
            couponApplied: coupon?.code || '',
          },
        });

        if (verifyRes.success) {
          setPlacedOrder(verifyRes.data);
          dispatch(clearCart());
          setStep(3);
        } else {
          throw new Error(verifyRes.error || 'COD placement failed');
        }
      }
    } catch (err: any) {
      dispatch(showToast({ message: err.message || 'Checkout failed', type: 'error' }));
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Checkout Stages indicator bar */}
      <div className="flex items-center justify-center gap-2 mb-10 text-xs sm:text-sm font-semibold text-gray-500">
        <span className={`${step === 1 ? 'text-gold font-bold' : 'text-gray-400'}`}>Address Details</span>
        <ChevronRight className="w-4 h-4 text-gray-300" />
        <span className={`${step === 2 ? 'text-gold font-bold' : 'text-gray-400'}`}>Secure Payment</span>
        <ChevronRight className="w-4 h-4 text-gray-300" />
        <span className={`${step === 3 ? 'text-gold font-bold' : 'text-gray-400'}`}>Order Confirmation</span>
      </div>

      {/* STEP 1: ADDRESS SELECTION */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-base font-bold text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-2">
              Select Delivery Destination
            </h3>

            {/* List saved addresses */}
            {user?.addresses && user.addresses.length > 0 && !isAddingNewAddr && (
              <div className="space-y-3">
                {user.addresses.map((addr: any) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-start gap-3 ${
                      selectedAddressId === addr.id
                        ? 'border-gold bg-gold/5 shadow-2xs'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      checked={selectedAddressId === addr.id}
                      onChange={() => {}} // Done via parent click
                      className="mt-1 accent-gold pointer-events-none"
                    />
                    <div className="text-xs sm:text-sm font-medium">
                      <span className="font-bold text-gray-800 capitalize bg-slate-100 px-2 py-0.5 rounded-full mr-2">
                        {addr.label}
                      </span>
                      <p className="text-gray-600 mt-1.5">{addr.street}</p>
                      <p className="text-gray-500 font-semibold">{addr.city}, {addr.state} - {addr.zip}</p>
                      <p className="text-gray-400 text-xs mt-1.5">Phone: {addr.phone}</p>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => setIsAddingNewAddr(true)}
                  className="text-xs font-bold text-gold hover:underline"
                >
                  + Add new address
                </button>
              </div>
            )}

            {/* Add new Address Form */}
            {isAddingNewAddr && (
              <form onSubmit={handleAddNewAddress} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-gray-100 shadow-3xs">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">New Shipping Details</h4>
                  {user?.addresses && user.addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewAddr(false)}
                      className="text-xs font-bold text-gray-500 hover:underline"
                    >
                      Back to list
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Address Label</span>
                    <select
                      value={newAddrLabel}
                      onChange={(e) => setNewAddrLabel(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                    >
                      <option value="Home">Home</option>
                      <option value="Office">Office</option>
                      <option value="Wedding Venue">Wedding Venue</option>
                    </select>
                  </div>

                  <div className="space-y-1 col-span-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Street & Landmark</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Flat 302, Green Meadows"
                      value={newAddrStreet}
                      onChange={(e) => setNewAddrStreet(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">City</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hyderabad"
                      value={newAddrCity}
                      onChange={(e) => setNewAddrCity(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">State</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Telangana"
                      value={newAddrState}
                      onChange={(e) => setNewAddrState(e.target.value)}
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
                      value={newAddrZip}
                      onChange={(e) => setNewAddrZip(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Recipient Phone</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876543210"
                      value={newAddrPhone}
                      onChange={(e) => setNewAddrPhone(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Save Address & Set
                </button>
              </form>
            )}
          </div>

          {/* Cart Pricing summary block */}
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-3xs space-y-4">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-50 pb-2">
              Payment Summary
            </h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span>{shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}</span>
              </div>
              {giftWrapping && (
                <div className="flex justify-between">
                  <span>Gift Wrap Charge</span>
                  <span>₹30</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="h-px bg-gray-100 my-2" />
              <div className="flex justify-between text-sm font-bold text-gray-900">
                <span>Total Payable</span>
                <span className="text-gold">₹{grandTotal}</span>
              </div>
            </div>
            <button
              onClick={handleNextToPayment}
              className="w-full py-3 bg-gold hover:bg-gold-hover text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              Continue to Payment
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SECURE PAYMENT GATEWAY */}
      {step === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2 space-y-6">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Address Selection
            </button>

            <h3 className="text-base font-bold text-gray-800 uppercase tracking-widest border-b border-gray-100 pb-2">
              Select Payment Method
            </h3>

            <div className="space-y-3">
              {/* Razorpay Option */}
              <div
                onClick={() => setPaymentMethod('Razorpay')}
                className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                  paymentMethod === 'Razorpay'
                    ? 'border-gold bg-gold/5 shadow-2xs'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={paymentMethod === 'Razorpay'}
                    onChange={() => {}}
                    className="accent-gold"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-gray-800 flex items-center gap-1.5">
                      <CreditCard className="w-4.5 h-4.5 text-blue-600" />
                      Razorpay Secure Payment
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1">UPI (GPay/PhonePe), Credit/Debit Cards, Netbanking</p>
                  </div>
                </div>
                <span className="text-[9px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold uppercase">
                  Fastest
                </span>
              </div>

              {/* COD Option */}
              <div
                onClick={() => setPaymentMethod('COD')}
                className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                  paymentMethod === 'COD'
                    ? 'border-gold bg-gold/5 shadow-2xs'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    checked={paymentMethod === 'COD'}
                    onChange={() => {}}
                    className="accent-gold"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-gray-800">
                      Cash On Delivery (COD)
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1">Pay with cash when your return gifts arrive</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold">
              <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" />
              <span>Sabi 100% Safe Checkout Guarantee. Your details are encrypted.</span>
            </div>
          </div>

          {/* Checkout billing summaries */}
          <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-3xs space-y-4">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-50 pb-2">
              Summary
            </h3>
            
            <div className="space-y-1.5 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-gray-700">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span className="font-semibold text-gray-700">₹{shippingCharge}</span>
              </div>
              {giftWrapping && (
                <div className="flex justify-between">
                  <span>Gift Wrap</span>
                  <span className="font-semibold text-gray-700">₹30</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="h-px bg-gray-100 my-2" />
              <div className="flex justify-between text-sm font-bold text-gray-900">
                <span>Grand Total</span>
                <span className="text-gold">₹{grandTotal}</span>
              </div>
            </div>

            <button
              onClick={handleCompleteOrder}
              disabled={processingPayment}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-gold hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              {processingPayment ? (
                <>
                  <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : paymentMethod === 'Razorpay' ? (
                'Proceed to Pay Online'
              ) : (
                'Place Cash On Delivery Order'
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: ORDER SUCCESS & RECEIPT */}
      {step === 3 && placedOrder && (
        <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-md text-center max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto border border-emerald-100 shadow-3xs animate-bounce-short">
            <CheckCircle className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 font-display">Order Confirmed!</h2>
            <p className="text-xs text-gray-400">Thank you for choosing Sabi. Your order has been placed successfully.</p>
          </div>

          <div className="bg-slate-50 border border-gray-100 rounded-2xl p-5 text-left text-xs sm:text-sm font-medium space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Order ID:</span>
              <span className="font-bold text-gray-800 uppercase">{placedOrder.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Transaction ID:</span>
              <span className="font-bold text-gray-800">{placedOrder.payment?.transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Charged:</span>
              <span className="font-bold text-gold">₹{placedOrder.pricing?.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Payment Mode:</span>
              <span className="font-bold text-gray-800">{placedOrder.payment?.method}</span>
            </div>
            <div className="flex justify-between items-center pt-2.5 border-t border-gray-100">
              <span className="text-gray-400">Invoice:</span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert(`Invoice downloaded locally: /invoices/inv_${placedOrder.id}.pdf`);
                }}
                className="text-xs text-gold hover:underline flex items-center gap-1 font-bold"
              >
                <FileText className="w-4 h-4 text-gold" />
                Download PDF Receipt
              </a>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/dashboard?tab=orders')}
              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Track Order Status
            </button>
            <button
              onClick={() => navigate('/shop')}
              className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
