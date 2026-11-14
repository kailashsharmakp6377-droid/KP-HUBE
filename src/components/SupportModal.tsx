import React, { useState } from 'react';
import { X, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api.ts';
import type { Student } from '../types/index.ts';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, student }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState(student?.phone || '');
  const [name, setName] = useState(student?.name || '');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!message.trim()) {
      setError('Please write your message or query.');
      return;
    }

    setLoading(true);
    try {
      await api.submitSupport(subject, message, name, phone);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-purple-800 to-purple-950 p-5 text-white flex items-center justify-between">
          <div>
            <h3 className="font-brand font-bold text-base">Help & Support</h3>
            <p className="text-[11px] text-purple-200">Direct message to KP HUBE course mentor</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-purple-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Query Submitted</h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Your question has been routed directly to the KP HUBE administrative dashboard. We will get back to you shortly.
              </p>
              <button
                onClick={onClose}
                className="w-full h-10 rounded-xl bg-purple-700 text-white font-medium text-xs mt-3"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Course lesson access or video playback query"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-purple-600 focus:outline-none"
                  required
                />
              </div>

              {!student && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Your Mobile Number or Gmail</label>
                  <input
                    type="text"
                    placeholder="you@gmail.com or 10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-purple-600 focus:outline-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Query / Message</label>
                <textarea
                  rows={4}
                  placeholder="Describe your question or issue in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:border-purple-600 focus:outline-none resize-none"
                  required
                />
              </div>

              <p className="text-[11px] text-slate-500">
                All inquiries are stored securely in the app server and addressed directly by the KP HUBE team.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:bg-slate-300 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-purple-700/20 active:scale-[0.99] transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Query</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
