import React, { useState, useEffect } from 'react';
import { 
  User, Smartphone, BookOpen, Receipt, HelpCircle, 
  LogOut, Trash2, CheckCircle2, ChevronRight, Edit3, ShieldAlert
} from 'lucide-react';
import { api, storage } from '../services/api.ts';
import type { Student, PaymentRecord } from '../types/index.ts';

interface ProfileScreenProps {
  student: Student | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onGoToCourse: () => void;
  onOpenSupport: () => void;
  onOpenAccountDeletion: () => void;
  onViewReceipt: (payment: PaymentRecord) => void;
  onRefreshStudent: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  student,
  onOpenAuth,
  onLogout,
  onGoToCourse,
  onOpenSupport,
  onOpenAccountDeletion,
  onViewReceipt,
  onRefreshStudent
}) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(student?.name || '');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (student) {
      setNameInput(student.name || '');
      api.getPaymentHistory()
        .then(res => setPayments(res.payments))
        .catch(console.error);
    }
  }, [student]);

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    setSavingName(true);
    try {
      await api.updateProfile(nameInput.trim());
      setEditingName(false);
      onRefreshStudent();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingName(false);
    }
  };

  // If student is not logged in
  if (!student) {
    return (
      <div className="space-y-6 pb-24 animate-fade-in text-center max-w-sm mx-auto py-12">
        <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-brand font-bold text-xl text-slate-900">
            Sign In to KP HUBE
          </h2>
          <p className="text-xs text-slate-500">
            Access your purchased YouTube course, manage profile details, and review payment receipts.
          </p>
        </div>

        <button
          onClick={onOpenAuth}
          className="w-full h-11 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs shadow-md shadow-purple-700/20 active:scale-95 transition-all"
        >
          Sign In with Mobile OTP
        </button>

        <div className="pt-6 border-t border-slate-200/80">
          <button
            onClick={onOpenSupport}
            className="text-xs text-slate-500 hover:text-purple-700 flex items-center justify-center gap-1.5 mx-auto"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Need Help or Have a Question?</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 animate-fade-in max-w-xl mx-auto">
      {/* 1. Profile Header Card */}
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-700 to-purple-900 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
            {student.name ? student.name.charAt(0).toUpperCase() : 'C'}
          </div>

          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter full name"
                  className="px-3 py-1.5 text-sm rounded-lg border border-purple-500 focus:outline-none flex-1"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="px-3 py-1.5 bg-purple-700 text-white text-xs font-semibold rounded-lg"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="px-2 py-1.5 text-xs text-slate-500"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="font-brand font-bold text-lg text-slate-900 truncate">
                  {student.name || 'Creator Student'}
                </h2>
                <button
                  onClick={() => setEditingName(true)}
                  className="p-1 text-slate-400 hover:text-purple-700"
                  title="Edit Name"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono font-medium">+91 {student.phone}</span>
            </div>

            <div className="mt-2">
              {student.isEnrolled ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Enrolled • Lifetime Access
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Not Yet Enrolled
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quick Navigation Options */}
      <section className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 divide-y divide-slate-100">
        <button
          onClick={onGoToCourse}
          className="w-full py-3.5 px-3 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">My Course</span>
              <span className="text-[11px] text-slate-500">
                {student.isEnrolled ? 'Open 14 lessons & study materials' : 'Unlock full course for ₹499'}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={onOpenSupport}
          className="w-full py-3.5 px-3 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Help & Support</span>
              <span className="text-[11px] text-slate-500">
                Send a question directly to the course creator
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </section>

      {/* 3. Payment & Purchase History */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-brand font-bold text-sm text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-purple-700" />
            <span>Purchase & Payment History</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            {payments.length} Records
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-500">
            No completed purchases on record yet.
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map(payment => (
              <div
                key={payment.id}
                onClick={() => onViewReceipt(payment)}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/20 cursor-pointer transition-all flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">₹{payment.amount}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      payment.status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {payment.status === 'paid' ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    {payment.receiptNumber || payment.orderId}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">
                    {new Date(payment.timestamp).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                  <span className="text-[11px] font-semibold text-purple-700 hover:underline">
                    View Invoice
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Account Actions: Logout & Deletion */}
      <section className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 space-y-2">
        <button
          onClick={onLogout}
          className="w-full py-3 px-3 flex items-center justify-between text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-xs font-semibold"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="w-4 h-4 text-slate-500" />
            <span>Sign Out from Device</span>
          </div>
        </button>

        <button
          onClick={onOpenAccountDeletion}
          className="w-full py-3 px-3 flex items-center justify-between text-rose-700 hover:bg-rose-50 rounded-xl transition-colors text-xs font-semibold"
        >
          <div className="flex items-center gap-2.5">
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Account Deletion Request (Play Store Compliance)</span>
          </div>
        </button>
      </section>
    </div>
  );
};
