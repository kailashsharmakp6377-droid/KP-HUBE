import React from 'react';
import { Lock, ExternalLink } from 'lucide-react';
import { AdminDashboard } from './views/AdminDashboard.tsx';

export const AdminPortalApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-900 flex flex-col">
      {/* Private Owner Top Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-sm">
              <Lock className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-brand font-bold text-sm tracking-tight text-white leading-none">
                KP HUBE • Private Owner Website
              </span>
              <span className="text-[10px] text-amber-300 font-medium tracking-wider uppercase mt-0.5">
                Restricted Admin Access Only
              </span>
            </div>
          </div>

          <a
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <span>Public Course Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Main Private Admin Content */}
      <main className="flex-1 flex justify-center py-6 px-3 sm:px-6">
        <div className="w-full max-w-6xl">
          <AdminDashboard
            onExit={() => {
              window.location.href = '/';
            }}
            onRefreshData={() => {
              // AdminDashboard already refreshes its own data; nothing extra needed here
            }}
          />
        </div>
      </main>
    </div>
  );
};
