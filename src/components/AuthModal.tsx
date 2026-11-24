import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { api, apiUrl, storage } from '../services/api.ts';
import { isNativeCapacitorApp } from '../hooks/usePWAInstall.ts';
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
  const [mode, setMode] = useState<'login' | 'register' | 'admin'>(initialMode);
  const [identifier, setIdentifier] = useState(initialPhone);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [ownerSetupKey, setOwnerSetupKey] = useState('');
  const [needsOwnerKey, setNeedsOwnerKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOwnerKey, setShowOwnerKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setPassword('');
      setOwnerSetupKey('');
      setShowOwnerKey(false);
      setNeedsOwnerKey(false);
      if (initialPhone) {
        setIdentifier(initialPhone.trim());
      } else {
        const lastUsed = storage.getLastIdentifier();
        if (lastUsed) {
          setIdentifier(lastUsed);
        }
      }
    }
  }, [isOpen, initialPhone, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = identifier.trim();
    if (!cleanId) {
      setError(
        mode === 'admin'
          ? 'Please enter your Owner Gmail address.'
          : 'Please enter your Gmail / Email or 10-digit mobile number.'
      );
      return;
    }

    if (mode === 'admin') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanId)) {
        setError('Please enter a valid Owner Gmail address.');
        return;
      }
      if (!password.trim()) {
        setError('Please enter your Password or Admin Secret Key.');
        return;
      }
      setLoading(true);
      try {
        const res = await api.adminLogin(password.trim(), cleanId);
        onClose();
        if (res.portalPath) {
          const targetUrl = isNativeCapacitorApp() ? apiUrl(res.portalPath) : res.portalPath;
          window.location.assign(targetUrl);
        }
      } catch (err: any) {
        setError(err.message || 'Access denied: Invalid Owner Gmail or Password.');
      } finally {
        setLoading(false);
      }
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
          ? await api.register({
              identifier: cleanId,
              password,
              name,
              ...(needsOwnerKey || ownerSetupKey ? { ownerSetupKey: ownerSetupKey.trim() } : {})
            })
          : await api.login({ identifier: cleanId, password });

      onSuccess(res.student);
      onClose();
    } catch (err: any) {
      if (err.requireOwnerKey) {
        setNeedsOwnerKey(true);
      }
      if (err.switchToLogin) {
        setMode('login');
      }
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
        <div className={`p-5 text-white ${
          mode === 'admin'
            ? 'bg-gradient-to-r from-slate-900 to-purple-900'
            : 'bg-gradient-to-r from-[#4f46e5] to-[#06b6d4]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-xs">
                {mode === 'admin' ? <ShieldCheck className="w-4 h-4 text-amber-300" /> : 'KP'}
              </div>
              <div>
                <h3 className="font-brand font-bold text-base leading-tight">
                  {mode === 'admin'
                    ? 'Owner Admin Sign In'
                    : mode === 'login'
                      ? 'Sign In to KP HUBE'
                      : 'Create Student Account'}
                </h3>
                <p className="text-[11px] text-white/85">
                  {mode === 'admin' ? 'Private Owner Portal Access' : 'Instant Access • No OTP Needed'}
                </p>
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
        {mode !== 'admin' && (
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
        )}

        {/* Content Body */}
        <div className="p-6 pt-4">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4">
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
                    name="name"
                    autoComplete="name"
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
                {mode === 'admin' ? 'Owner Gmail Address' : 'Gmail / Email or Mobile Number'}
              </label>
              <div className="relative flex items-center rounded-xl border border-slate-300 focus-within:border-[#4f46e5] focus-within:ring-2 focus-within:ring-indigo-100 transition-all overflow-hidden">
                <span className="pl-3 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type={mode === 'admin' ? 'email' : 'text'}
                  name="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder={mode === 'admin' ? 'Enter Owner Gmail' : 'you@gmail.com or 9876543210'}
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
                {mode === 'admin' ? 'Password / Admin Secret Key' : 'Password'}
              </label>
              <div className="relative flex items-center rounded-xl border border-slate-300 focus-within:border-[#4f46e5] focus-within:ring-2 focus-within:ring-indigo-100 transition-all overflow-hidden">
                <span className="pl-3 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  placeholder={mode === 'admin' ? 'Enter Password or Admin Key' : 'Minimum 6 characters'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  required
                  minLength={mode === 'admin' ? 1 : 6}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="pr-3 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && needsOwnerKey && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-amber-800">
                  Private Owner Admin Key
                </label>
                <div className="relative flex items-center rounded-xl border border-amber-400 bg-amber-50/50 focus-within:border-[#4f46e5] focus-within:ring-2 focus-within:ring-indigo-100 transition-all overflow-hidden">
                  <span className="pl-3 text-amber-600">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <input
                    type={showOwnerKey ? 'text' : 'password'}
                    autoComplete="off"
                    placeholder="Enter your ADMIN_SECRET_KEY"
                    value={ownerSetupKey}
                    onChange={(e) => setOwnerSetupKey(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm text-slate-900 bg-transparent placeholder:text-slate-400 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    aria-label={showOwnerKey ? 'Hide owner key' : 'Show owner key'}
                    onClick={() => setShowOwnerKey(!showOwnerKey)}
                    className="pr-3 text-amber-700 hover:text-amber-900"
                  >
                    {showOwnerKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-amber-800 leading-snug">
                  Enter the private ADMIN_SECRET_KEY from your AI Studio Secrets / Environment to verify owner setup.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                !identifier.trim() ||
                (mode === 'admin' ? !password.trim() : password.length < 6)
              }
              className={`w-full h-11 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all disabled:opacity-50 ${
                mode === 'admin'
                  ? 'bg-slate-900 hover:bg-purple-950 shadow-slate-900/20'
                  : 'bg-gradient-to-r from-[#4f46e5] to-[#06b6d4] hover:opacity-95 shadow-indigo-500/20'
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'admin'
                      ? 'Open Private Admin Website'
                      : mode === 'login'
                        ? 'Sign In Now'
                        : 'Create Account & Save'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Small Admin Button Right Below Login */}
            {mode === 'admin' ? (
              <div className="pt-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setPassword('');
                  }}
                  className="text-xs font-semibold text-[#4f46e5] hover:underline"
                >
                  Back to Student Sign In
                </button>
              </div>
            ) : (
              <div className="pt-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('admin');
                    setError(null);
                    setPassword('');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-[#4f46e5] hover:bg-indigo-50/70 border border-slate-200/80 transition-colors"
                >
                  <ShieldCheck className="w-3 h-3 text-amber-500" />
                  <span>Admin</span>
                </button>
              </div>
            )}
          </form>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center space-y-1">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {mode === 'admin'
                  ? 'Protected by Owner Gmail & Private Key verification'
                  : 'Your account & progress remain saved automatically'}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
