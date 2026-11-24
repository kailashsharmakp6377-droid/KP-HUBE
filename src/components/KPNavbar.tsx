import React from 'react';
import { UserCheck, Download } from 'lucide-react';
import type { Student } from '../types/index.ts';
import { PWAInstallButton } from './PWAInstallButton.tsx';
import { apiUrl } from '../services/api.ts';

interface KPNavbarProps {
  currentTab: 'home' | 'course' | 'profile';
  onSelectTab: (tab: 'home' | 'course' | 'profile') => void;
  student: Student | null;
  onOpenAuth: () => void;
  apkAvailable: boolean;
}

export const KPNavbar: React.FC<KPNavbarProps> = ({
  onSelectTab,
  student,
  onOpenAuth,
  apkAvailable
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 h-15 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div
          onClick={() => onSelectTab('home')}
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

        {/* Zone 2: Public Actions (Install PWA, Official APK Download if published, Auth) */}
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

          {/* Student Auth status / Login Button */}
          {student ? (
            <button
              onClick={() => onSelectTab('profile')}
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
