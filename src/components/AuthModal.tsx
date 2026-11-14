import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api.ts';
import type { Student } from '../types/index.ts';

interface AuthModalProps {
  isOpen: boolean;
  initialPhone?: string;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (student: Student) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialPhone = '',
  initialMode = 'login',
  onClose,
  onSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [identifier, setIdentifier] = useState(initialPhone);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setPassword('');
      if (initialPhone) {
        setIdentifier(initialPhone.trim());
      }
    }
  }, [isOpen, initialPhone, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('Please enter your Gmail / Email or 10-digit mobile number.');
      return;
    }

    if (cleanId.includes('@')) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanId)) {
        setError('Please enter a valid Gmail or Email address.');
        return;
      }
    } else {
      const digits = cleanId.replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(digits)) {
        setError('Enter a valid 10-digit Indian mobile number or a Gmail/Email address.');
        return;
      }
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res =
        mode === 'register'
          ? await api.register({ identifier: cleanId, password, name })
          : await api.login({ identifier: cleanId, password });

      onSuccess(res.student);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
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
        <div className="bg-gradient-to-r from-[#4f46e5] to-[#06b6d4] p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-xs">
                KP
              </div>
              <div>
                <h3 className="font-brand font-bold text-base leading-tight">
                  {mode === 'login' ? 'Sign In to KP HUBE' : 'Create Student Account'}
                </h3>
                <p className="text-[11px] text-white/85">Instant Access • No OTP Needed</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="px-6 pt-5">
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'login' ? 'bg-white text-[#4f46e5] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'register' ? 'bg-white text-[#4f46e5] shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 pt-4">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative flex items-center rounded-xl border border-slate-300 focus-within:border-[#4f46e5] focus-within:ring-2 focus-within:ring-indigo-100 transition-all overflow-hidden">
                  <span className="pl-3 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Gmail / Email or Mobile Number
              </label>
              <div className="relative flex items-center rounded-xl border border-slate-300 focus-within:border-[#4f46e5] focus-within:ring-2 focus-within:ring-indigo-100 transition-all overflow-hidden">
                <span className="pl-3 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="you@gmail.com or 9876543210"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative flex items-center rounded-xl border border-slate-300 focus-within:border-[#4f46e5] focus-within:ring-2 focus-within:ring-indigo-100 transition-all overflow-hidden">
                <span className="pl-3 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pr-3 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !identifier.trim() || password.length < 6}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#06b6d4] hover:opacity-95 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 active:scale-[0.99] transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In Now' : 'Create Account & Save'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center space-y-1">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Your account & progress remain saved automatically</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
