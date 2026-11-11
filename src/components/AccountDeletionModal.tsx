import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { api } from '../services/api.ts';

interface AccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({
  isOpen,
  onClose,
  onDeleted
}) => {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.deleteAccount();
      onDeleted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to process deletion request.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h3 className="font-brand font-bold text-sm">Delete Account & Data</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            In compliance with Google Play Store data protection policies, you may permanently delete your student account.
          </p>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 space-y-1">
            <span className="font-semibold block">What happens when you delete:</span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500">
              <li>Your phone number and name are purged.</li>
              <li>Lesson progress and completion history are wiped.</li>
              <li>Active course access will be terminated.</li>
            </ul>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Type <strong className="text-rose-700">DELETE</strong> to confirm:
            </label>
            <input
              type="text"
              placeholder="DELETE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-none font-mono"
            />
          </div>

          {error && <p className="text-rose-600 font-semibold">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || confirmText !== 'DELETE'}
              className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
