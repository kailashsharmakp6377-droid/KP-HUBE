import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Copy, Check, ExternalLink, ArrowRight, ShieldCheck, Loader2, Sparkles, QrCode } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api.ts';
import type { Student } from '../types/index.ts';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onPaymentSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  student,
  onPaymentSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [orderData, setOrderData] = useState<{
    orderId: string;
    amountRupees: number;
    receiptNumber: string;
    upiVpa: string;
    qrImageUrl: string;
    upiIntentUrl: string;
  } | null>(null);

  const [step, setStep] = useState<'pay' | 'verifying' | 'success' | 'error'>('pay');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('pay');
      setErrorMessage(null);
      setUtrInput('');
      initiateOrder();
    }
  }, [isOpen]);

  const initiateOrder = async () => {
    if (!student) return;
    setLoading(true);
    try {
      const order = await api.createOrder();
      const upiStatus = await api.getUpiStatus();
      setOrderData({
        orderId: order.orderId,
        amountRupees: order.amountRupees,
        receiptNumber: order.receiptNumber,
        upiVpa: order.upiVpa || upiStatus.verifiedUpiVpa || 'kailash100k@axl',
        qrImageUrl: '/assets/payment_qr.jpeg',
        upiIntentUrl:
          order.upiIntentUrl ||
          `upi://pay?pa=${encodeURIComponent(upiStatus.verifiedUpiVpa || 'kailash100k@axl')}&pn=${encodeURIComponent('KP HUBE')}&am=${order.amountRupees}&cu=INR&tn=${encodeURIComponent('KP HUBE Complete YouTube Course')}`
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

  const handleDirectUpiIntent = () => {
    if (orderData?.upiIntentUrl) {
      window.location.href = orderData.upiIntentUrl;
    }
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
              <h3 className="font-brand font-bold text-sm leading-tight">PhonePe & UPI Payment</h3>
              <p className="text-[11px] text-white/80">KP HUBE Complete YouTube Course</p>
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
        <div className="p-5 max-h-[80vh] overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="w-8 h-8 text-[#4f46e5] animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Preparing payment QR & UPI gateway...</p>
            </div>
          ) : step === 'pay' && orderData ? (
            <div className="space-y-4 text-center">
              {/* Price Banner */}
              <div className="bg-[#f1f5ff] p-3 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#14213d]">Amount Payable</span>
                <span className="font-brand font-black text-2xl text-[#4f46e5]">₹{orderData.amountRupees}</span>
              </div>

              {/* Direct UPI App Intent Trigger (Mobile Users) */}
              <button
                type="button"
                onClick={handleDirectUpiIntent}
                className="w-full h-11 rounded-xl bg-[#5f259f] hover:bg-[#4b1d7e] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-900/20 active:scale-95 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Pay directly via PhonePe / GPay / Paytm</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  OR SCAN QR CODE
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Prominent PhonePe QR Code Container */}
              <div className="bg-white p-3 rounded-2xl border-2 border-indigo-200 shadow-md inline-block mx-auto max-w-[260px]">
                <img
                  src={orderData.qrImageUrl}
                  alt="PhonePe Accepted Here QR Code"
                  className="w-full aspect-[1/2] object-contain rounded-xl"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/aistudio/WhatsApp_Image_2026-11-11_at_1.18.25_AM_2b44318e.jpeg';
                  }}
                />
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
                  placeholder="Enter 12-digit UTR Number from PhonePe"
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
                Your payment of <strong>₹{orderData?.amountRupees || 499}</strong> has been verified. The <strong>KP HUBE Complete YouTube Course</strong> is now unlocked.
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
