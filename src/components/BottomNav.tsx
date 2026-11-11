import React from 'react';
import { Home, PlayCircle, User } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'home' | 'course' | 'profile';
  onSelectTab: (tab: 'home' | 'course' | 'profile') => void;
  isEnrolled: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab, isEnrolled }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.03)] pb-safe transition-transform">
      <div className="max-w-md mx-auto grid grid-cols-3 h-16 items-center px-4">
        {/* Tab 1: Home */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors relative ${
            currentTab === 'home' ? 'text-purple-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className={`w-5 h-5 transition-transform ${currentTab === 'home' ? 'scale-110' : ''}`} />
          <span className="text-[11px] mt-1 tracking-tight">Home</span>
          {currentTab === 'home' && (
            <span className="absolute bottom-1 w-6 h-0.5 bg-amber-500 rounded-full" />
          )}
        </button>

        {/* Tab 2: My Course */}
        <button
          onClick={() => onSelectTab('course')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors relative ${
            currentTab === 'course' ? 'text-purple-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <PlayCircle className={`w-5 h-5 transition-transform ${currentTab === 'course' ? 'scale-110' : ''}`} />
            {isEnrolled && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
            )}
          </div>
          <span className="text-[11px] mt-1 tracking-tight">My Course</span>
          {currentTab === 'course' && (
            <span className="absolute bottom-1 w-6 h-0.5 bg-amber-500 rounded-full" />
          )}
        </button>

        {/* Tab 3: Profile */}
        <button
          onClick={() => onSelectTab('profile')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors relative ${
            currentTab === 'profile' ? 'text-purple-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className={`w-5 h-5 transition-transform ${currentTab === 'profile' ? 'scale-110' : ''}`} />
          <span className="text-[11px] mt-1 tracking-tight">Profile</span>
          {currentTab === 'profile' && (
            <span className="absolute bottom-1 w-6 h-0.5 bg-amber-500 rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
};
