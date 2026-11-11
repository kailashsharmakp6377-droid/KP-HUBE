import React from 'react';
import { X, Printer, CheckCircle, Download } from 'lucide-react';
import type { PaymentRecord } from '../types/index.ts';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentRecord | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, payment }) => {
  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print:m-0 print:border-none print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Toolbar (hidden on print) */}
        <div className="p-4 bg-slate-100 flex items-center justify-between border-b border-slate-200 print:hidden">
          <span className="font-semibold text-xs text-slate-700">Official Purchase Invoice</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Document */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-900">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-purple-700 flex items-center justify-center text-amber-400 font-bold text-xs">
                  KP
                </div>
                <span className="font-brand font-black text-xl text-slate-900">KP HUBE</span>
              </div>
              <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-widest">
                LEARN • GROW • SUCCEED
              </p>
              <p className="text-xs text-slate-500 mt-1">Official Course Tax Invoice</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" /> Paid & Verified
              </span>
              <p className="text-xs text-slate-500 mt-1 font-mono">{payment.receiptNumber}</p>
            </div>
          </div>

          {/* Student & Transaction Details */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Billed To Student:</span>
              <p className="font-semibold text-slate-800 mt-0.5">{payment.studentName || 'Creator Student'}</p>
              <p className="font-mono text-slate-600">+91 {payment.studentPhone}</p>
            </div>
            <div className="text-right">
              <span className="text-slate-400 font-medium">Transaction Date:</span>
              <p className="font-semibold text-slate-800 mt-0.5">
                {new Date(payment.timestamp).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
              <p className="text-slate-500 text-[11px]">
                {new Date(payment.timestamp).toLocaleTimeString('en-IN')}
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-2 text-left">Description</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3">
                  <div className="font-semibold text-slate-900">KP HUBE Complete YouTube Course</div>
                  <div className="text-[11px] text-slate-500">14 Roman Hindi Lessons • Lifetime App Access</div>
                </td>
                <td className="py-3 text-center">1</td>
                <td className="py-3 text-right font-semibold">₹499.00</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-900 font-bold text-sm">
                <td className="py-3" colSpan={2}>Total Amount Paid</td>
                <td className="py-3 text-right text-purple-900">₹499.00</td>
              </tr>
            </tfoot>
          </table>

          {/* Verification Audit Information */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] space-y-1 text-slate-600">
            <div className="flex justify-between">
              <span>Order Reference ID:</span>
              <span className="font-mono font-medium text-slate-900">{payment.orderId}</span>
            </div>
            {payment.paymentId && (
              <div className="flex justify-between">
                <span>Gateway Payment ID:</span>
                <span className="font-mono font-medium text-slate-900">{payment.paymentId}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Verified Payee:</span>
              <span className="font-semibold text-purple-800">KP HUBE (kailash100k@axl)</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
            This is a computer-generated tax receipt issued by KP HUBE. No signature required.
          </div>
        </div>
      </div>
    </div>
  );
};
