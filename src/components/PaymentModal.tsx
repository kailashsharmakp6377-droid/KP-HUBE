import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle2, Copy, Check, ExternalLink, ShieldCheck,
  Loader2, Download, Smartphone, AlertCircle, CreditCard
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api.ts';
import { isNativeCapacitorApp } from '../hooks/usePWAInstall.ts';
import type { Course, Student } from '../types/index.ts';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  course?: Course | null;
  onPaymentSuccess: () => void;
}

function buildCleanUpiQuery(vpa: string, payeeName: string, amountRupees: number, note: string, orderRef?: string): string {
  const cleanNote =
    (note || 'KP HUBE Course')
      .replace(/[^a-zA-Z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 40) || 'KP HUBE Course';
  const params: [string, string][] = [
    ['pa', vpa],
    ['pn', payeeName],
    ['am', Number(amountRupees).toFixed(2)],
    ['cu', 'INR'],
    ['tn', cleanNote]
  ];
  if (orderRef) {
    params.push(['tr', orderRef.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 35)]);
  }
  return params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  student,
  course,
  onPaymentSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [launchedAppNotice, setLaunchedAppNotice] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<{
    orderId: string;
    razorpayOrderId?: string;
    hasLiveGatewayKeys?: boolean;
    key?: string;
    courseTitle: string;
    amountRupees: number;
    receiptNumber: string;
    upiVpa: string;
    qrImageUrl: string;
    upiQuery: string;
    upiIntentUrl: string;
  } | null>(null);

  const [step, setStep] = useState<'pay' | 'verifying' | 'success' | 'error'>('pay');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('pay');
      setErrorMessage(null);
      setLaunchedAppNotice(null);
      setUtrInput('');
      initiateOrder();
    }
  }, [isOpen, course?.id]);

  const initiateOrder = async () => {
    if (!student) return;
    setLoading(true);
    try {
      const order = await api.createOrder(course?.id);
      const upiStatus = await api.getUpiStatus(course?.id);
      const title = order.courseTitle || course?.title || 'KP HUBE Course';
      const vpa = order.upiVpa || upiStatus.verifiedUpiVpa || 'kailash100k@axl';
      const payeeName = upiStatus.verifiedPayeeName || 'KP HUBE';
      const upiQuery =
        order.upiQuery || buildCleanUpiQuery(vpa, payeeName, order.amountRupees, title, order.orderId);

      setOrderData({
        orderId: order.orderId,
        razorpayOrderId: order.razorpayOrderId,
        hasLiveGatewayKeys: Boolean(order.hasLiveGatewayKeys),
        key: order.key,
        courseTitle: title,
        amountRupees: order.amountRupees,
        receiptNumber: order.receiptNumber,
        upiVpa: vpa,
        qrImageUrl: '/assets/payment_qr.jpeg',
        upiQuery,
        upiIntentUrl: order.upiIntentUrl || `upi://pay?${upiQuery}`
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to initialize payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUpi = () => {
    if (!orderData?.upiVpa) return;
    navigator.clipboard.writeText(orderData.upiVpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isAndroid = /android/i.test(ua);
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isNativeApp = isNativeCapacitorApp();
  const isMobile = isAndroid || isIos || isNativeApp;
  const inIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const getAppDeepLink = (appId: 'phonepe' | 'gpay' | 'paytm' | 'generic'): string => {
    if (!orderData) return '#';
    const q = orderData.upiQuery;
    if (isAndroid && !isNativeApp) {
      if (appId === 'phonepe') {
        return `intent://pay?${q}#Intent;scheme=upi;package=com.phonepe.app;end`;
      }
      if (appId === 'gpay') {
        return `intent://pay?${q}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
      }
      if (appId === 'paytm') {
        return `intent://pay?${q}#Intent;scheme=upi;package=net.one97.paytm;end`;
      }
      return `upi://pay?${q}`;
    }

    if (appId === 'phonepe') return `phonepe://pay?${q}`;
    if (appId === 'gpay') return `tez://upi/pay?${q}`;
    if (appId === 'paytm') return `paytmmp://pay?${q}`;
    return `upi://pay?${q}`;
  };

  const handleUpiLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, appName: string) => {
    if (!orderData) {
      e.preventDefault();
      return;
    }
    if (!isMobile) {
      e.preventDefault();
      setLaunchedAppNotice(
        `You are on a laptop/desktop browser. Direct ${appName} links open on mobile phones — please scan the QR code below with ${appName} on your phone, or save the QR image.`
      );
      return;
    }
    setLaunchedAppNotice(
      `Opening ${appName} for ₹${orderData.amountRupees}... After paying, enter your 12-digit UTR / Ref No. below. If ${appName} shows any bank limit on direct links, tap "Save QR" below and scan from Gallery.`
    );
  };

  const handleRazorpayCheckout = () => {
    if (!orderData?.hasLiveGatewayKeys || !orderData.razorpayOrderId) return;
    const RazorpayCtor = (window as any).Razorpay;
    if (!RazorpayCtor) {
      setErrorMessage('Payment gateway script is still loading. Please try again or pay via UPI / QR below.');
      return;
    }

    const rzp = new RazorpayCtor({
      key: orderData.key,
      amount: orderData.amountRupees * 100,
      currency: 'INR',
      name: 'KP HUBE',
      description: orderData.courseTitle,
      order_id: orderData.razorpayOrderId,
      prefill: {
        name: student?.name || 'Creator',
        email: student?.email || undefined,
        contact: student?.phone || undefined
      },
      theme: { color: '#4f46e5' },
      handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
        setStep('verifying');
        try {
          await api.verifyPayment({
            orderId: response.razorpay_order_id || orderData.orderId,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature
          });
          setStep('success');
          confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
          onPaymentSuccess();
        } catch (err: any) {
          setErrorMessage(err.message || 'Gateway verification failed.');
          setStep('error');
        }
      }
    });
    rzp.open();
  };

  const handleVerifyUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderData) return;

    const cleanUtr = utrInput.trim();
    if (cleanUtr.length < 8) {
      setErrorMessage('Please enter your valid 12-digit UTR / Transaction Ref number (minimum 8 characters).');
      return;
    }

    setStep('verifying');
    setErrorMessage(null);

    try {
      await api.verifyPayment({
        orderId: orderData.orderId,
        paymentId: cleanUtr
      });

      setStep('success');
      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
      onPaymentSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment verification failed.');
      setStep('error');
    }
  };

  if (!isOpen) return null;

  const linkTarget = inIframe && !isNativeApp ? '_blank' : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#4f46e5] to-[#06b6d4] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold">
              ₹
            </div>
            <div>
              <h3 className="font-brand font-bold text-sm leading-tight">PhonePe, GPay & Paytm</h3>
              <p className="text-[11px] text-white/80 truncate max-w-[220px]">
                {orderData?.courseTitle || course?.title || 'KP HUBE Course'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[82vh] overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="w-8 h-8 text-[#4f46e5] animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Preparing direct UPI & QR payment...</p>
            </div>
          ) : step === 'pay' && orderData ? (
            <div className="space-y-4 text-center">
              {/* Price Banner */}
              <div className="bg-[#f1f5ff] p-3 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#14213d]">Amount Payable</span>
                <span className="font-brand font-black text-2xl text-[#4f46e5]">₹{orderData.amountRupees}</span>
              </div>

              {/* Instant Live Gateway Option (When Razorpay live keys are configured) */}
              {orderData.hasLiveGatewayKeys && orderData.razorpayOrderId && (
                <button
                  type="button"
                  onClick={handleRazorpayCheckout}
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay Online Instantly (Auto-Unlock)</span>
                </button>
              )}

              {/* Dedicated Direct UPI App Buttons (PhonePe / Google Pay / Paytm + Generic UPI) */}
              <div className="space-y-2 text-left">
                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#4f46e5]" />
                  <span>Direct Pay via UPI App (Mobile)</span>
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={getAppDeepLink('phonepe')}
                    target={linkTarget}
                    rel="noopener noreferrer"
                    onClick={(e) => handleUpiLinkClick(e, 'PhonePe')}
                    className="h-11 rounded-xl bg-[#5f259f] hover:bg-[#4b1d7e] text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all no-underline"
                  >
                    <span>PhonePe</span>
                  </a>
                  <a
                    href={getAppDeepLink('gpay')}
                    target={linkTarget}
                    rel="noopener noreferrer"
                    onClick={(e) => handleUpiLinkClick(e, 'Google Pay')}
                    className="h-11 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all no-underline"
                  >
                    <span>GPay</span>
                  </a>
                  <a
                    href={getAppDeepLink('paytm')}
                    target={linkTarget}
                    rel="noopener noreferrer"
                    onClick={(e) => handleUpiLinkClick(e, 'Paytm')}
                    className="h-11 rounded-xl bg-[#002970] hover:bg-[#001d52] text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all no-underline"
                  >
                    <span>Paytm</span>
                  </a>
                </div>

                <a
                  href={getAppDeepLink('generic')}
                  target={linkTarget}
                  rel="noopener noreferrer"
                  onClick={(e) => handleUpiLinkClick(e, 'UPI App')}
                  className="w-full h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] flex items-center justify-center gap-1.5 border border-slate-200 transition-colors no-underline"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                  <span>Open Other UPI App (BHIM / Amazon Pay / Cred)</span>
                </a>
              </div>

              {launchedAppNotice && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-left text-[11px] text-amber-900 flex items-start gap-2 leading-snug">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{launchedAppNotice}</span>
                </div>
              )}

              <div className="relative flex py-0.5 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  OR SCAN / SAVE QR CODE
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Prominent PhonePe QR Code Container */}
              <div className="space-y-2">
                <div className="bg-white p-2.5 rounded-2xl border-2 border-indigo-200 shadow-md inline-block mx-auto max-w-[230px]">
                  <img
                    src={orderData.qrImageUrl}
                    alt="PhonePe Accepted Here QR Code"
                    className="w-full aspect-[1/2] object-contain rounded-xl"
                    onError={(e) => {
                      e.currentTarget.src = '/assets/aistudio/WhatsApp_Image_2026-11-11_at_1.18.25_AM_2b44318e.jpeg';
                    }}
                  />
                </div>
                <div>
                  <a
                    href={orderData.qrImageUrl}
                    download="KP-HUBE-Payment-QR.jpeg"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4f46e5] font-semibold text-[11px] border border-indigo-200/70 transition-colors no-underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save QR to Scan from Gallery</span>
                  </a>
                </div>
              </div>

              {/* UPI ID Copy Bar */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="text-left min-w-0 pr-2">
                  <span className="text-[10px] text-slate-400 block font-medium">UPI ID</span>
                  <span className="font-mono font-bold text-slate-800 text-[11px] truncate block">
                    {orderData.upiVpa}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[#4f46e5] font-semibold text-[11px] flex items-center gap-1 shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Step 2: Verification Input */}
              <form onSubmit={handleVerifyUtr} className="pt-2 text-left space-y-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-[#14213d]">
                  Payment Confirmation (UTR / Ref No.)
                </label>
                {errorMessage && (
                  <p className="text-[11px] text-rose-600 font-semibold">{errorMessage}</p>
                )}
                <input
                  type="text"
                  placeholder="Enter 12-digit UTR Number from PhonePe / GPay / Paytm"
                  value={utrInput}
                  onChange={(e) => {
                    setUtrInput(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  minLength={8}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#4f46e5] focus:outline-none font-mono"
                />
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#06b6d4] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>I Have Paid & Verify Access</span>
                </button>
              </form>
            </div>
          ) : step === 'verifying' ? (
            <div className="py-10 text-center space-y-3">
              <Loader2 className="w-10 h-10 text-[#4f46e5] animate-spin mx-auto" />
              <h4 className="font-brand font-bold text-base text-[#14213d]">
                Verifying UPI Transaction...
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Recording your payment reference and activating lifetime access to all course episodes.
              </p>
            </div>
          ) : step === 'success' ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-brand font-bold text-xl text-[#14213d]">
                Payment Verified!
              </h4>
              <p className="text-xs text-slate-600">
                Your payment of <strong>₹{orderData?.amountRupees || course?.price || 49}</strong> has been verified. <strong>{orderData?.courseTitle || course?.title || 'Your course'}</strong> is now unlocked.
              </p>
              <button
                onClick={onClose}
                className="w-full h-11 rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs mt-3 shadow-md"
              >
                Go to My Course
              </button>
            </div>
          ) : (
            <div className="py-6 text-center space-y-3">
              <p className="text-xs text-rose-600">{errorMessage || 'Verification error'}</p>
              <button
                onClick={() => setStep('pay')}
                className="w-full h-10 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
