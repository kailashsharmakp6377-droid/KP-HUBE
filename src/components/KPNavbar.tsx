import React from 'react';
import { ShieldCheck, UserCheck, LayoutGrid, Smartphone, Download } from 'lucide-react';
import type { Student } from '../types/index.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { apiUrl } from '../services/api.ts';

interface KPNavbarProps {
  currentTab: 'home' | 'course' | 'profile';
  onSelectTab: (tab: 'home' | 'course' | 'profile') => void;
  student: Student | null;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  isAdminActive: boolean;
  canAccessAdmin: boolean;
  apkAvailable: boolean;
  appMode: 'concept_4cards' | 'live_app';
  onToggleAppMode: (mode: 'concept_4cards' | 'live_app') => void;
}

export const KPNavbar: React.FC<KPNavbarProps> = ({
  onSelectTab,
  student,
  onOpenAuth,
  onOpenAdmin,
  isAdminActive,
  canAccessAdmin,
  apkAvailable,
  appMode,
  onToggleAppMode
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 h-15 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div
          onClick={() => {
            if (isAdminActive) onOpenAdmin();
            else onSelectTab('home');
          }}
          className="flex items-center gap-2.5 cursor-pointer shrink-0 select-none"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4f46e5] to-[#06b6d4] flex items-center justify-center shadow-sm shadow-indigo-600/20">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-brand font-black text-lg tracking-tight text-[#14213d] leading-none">
              KP HUBE
            </span>
            <span className="text-[9px] font-bold tracking-widest text-[#4f46e5] uppercase leading-none mt-0.5">
              LEARN • GROW • SUCCEED
            </span>
          </div>
        </div>

        {/* Zone 2: Owner-only view switcher (completely hidden from public users) */}
        {(canAccessAdmin || isAdminActive) && (
          <div className="hidden md:flex items-center gap-1 bg-[#f1f5ff] p-1 rounded-xl border border-indigo-100">
            <button
              onClick={() => {
                if (isAdminActive) onOpenAdmin();
                onToggleAppMode('live_app');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                appMode === 'live_app' && !isAdminActive
                  ? 'bg-white text-[#4f46e5] shadow-sm'
                  : 'text-[#62708b] hover:text-[#14213d]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Website / App</span>
            </button>

            <button
              onClick={() => {
                if (isAdminActive) onOpenAdmin();
                onToggleAppMode('concept_4cards');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                appMode === 'concept_4cards' && !isAdminActive
                  ? 'bg-white text-[#4f46e5] shadow-sm'
                  : 'text-[#62708b] hover:text-[#14213d]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>4 Cards Showcase</span>
            </button>
          </div>
        )}

        {/* Zone 3: Public Actions (Install PWA, Official APK Download if published, Auth) */}
        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton />

          {/* Public Download Button — ONLY appears when an official .APK is published, never serves .ZIP */}
          {apkAvailable && (
            <a
              href={apiUrl('/api/apk/download')}
              download="KP-HUBE.apk"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg shadow-sm transition-all"
              title="Download Official KP HUBE Android App (.APK)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download APK</span>
              <span className="sm:hidden">APK</span>
            </a>
          )}

          {/* Owner Admin Button — STRICTLY hidden from public visitors & students */}
          {(canAccessAdmin || isAdminActive) && (
            <button
              onClick={onOpenAdmin}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                isAdminActive
                  ? 'bg-[#14213d] text-white shadow-sm'
                  : 'bg-indigo-50 text-[#4f46e5] hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span className="whitespace-nowrap">{isAdminActive ? 'Exit Admin' : 'Owner Admin'}</span>
            </button>
          )}

          {/* Student Auth status / Login Button */}
          {student ? (
            <button
              onClick={() => {
                onToggleAppMode('live_app');
                onSelectTab('profile');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#f7f8fc] hover:bg-[#eef2ff] text-slate-800 rounded-lg border border-[#dfe4ef] transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#059669]" />
              <span className="max-w-[80px] sm:max-w-[120px] truncate font-semibold">
                {student.name || student.email || (student.phone ? `+91 ${student.phone.slice(-4)}` : 'Student')}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#4f46e5] to-[#06b6d4] hover:opacity-95 active:scale-95 rounded-lg transition-all shadow-sm whitespace-nowrap"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
