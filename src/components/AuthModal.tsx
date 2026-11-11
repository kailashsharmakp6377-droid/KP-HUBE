import React, { useState } from 'react';
import { X, Smartphone, KeyRound, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api.ts';
import type { Student } from '../types/index.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (student: Student) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendOtp(cleanPhone);
      setDevCode(res.devCode || null);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (otp.length < 4) {
      setError('Please enter the 6-digit OTP received on your mobile.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyOtp(phone.replace(/\D/g, ''), otp, name);
      onSuccess(res.student);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 to-purple-950 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center text-purple-950 font-bold text-xs">
                KP
              </div>
              <div>
                <h3 className="font-brand font-bold text-base leading-tight">Student Sign In</h3>
                <p className="text-[11px] text-purple-200">KP HUBE Complete YouTube Course</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-purple-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mobile Number (India)
                </label>
                <div className="relative flex rounded-xl border border-slate-300 focus-within:border-purple-600 focus-within:ring-2 focus-within:ring-purple-100 transition-all overflow-hidden">
                  <span className="flex items-center px-3 bg-slate-100 text-slate-600 text-sm font-semibold border-r border-slate-200">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    autoFocus
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  We send an instant OTP for login and course registration.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full h-11 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:bg-slate-300 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md shadow-purple-700/20 active:scale-[0.99] transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Get Verification OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center pb-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                  <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                  OTP sent to <span className="font-bold text-slate-900">+91 {phone}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="block mx-auto text-[11px] text-purple-700 font-semibold hover:underline mt-1"
                >
                  Change Number
                </button>
              </div>

              {/* Developer / Sandbox hint */}
              {devCode && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-900">
                  <span className="font-semibold">Test Mode OTP:</span>{' '}
                  <span className="font-mono font-bold text-sm tracking-widest text-amber-950">{devCode}</span>
                  <p className="text-[10px] text-amber-700 mt-0.5">(Live SMS activates via Firebase/Twilio keys)</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
                  Enter 6-Digit OTP
                </label>
                <div className="flex items-center justify-center">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-48 text-center tracking-[0.4em] font-mono text-xl font-bold px-3 py-2.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 4}
                className="w-full h-11 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:bg-slate-300 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md shadow-purple-700/20 active:scale-[0.99] transition-all"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-500">
              Safe & Secure Indian Mobile Authentication • Session stays persistent
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
