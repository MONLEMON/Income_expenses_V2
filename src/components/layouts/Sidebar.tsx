'use client';

import React from 'react';
import { LayoutDashboard, FolderOpen, LogOut, Target, BarChart3 } from 'lucide-react';
import { useTranslation } from '@/hooks/useLanguageStore';
import { useAuthStore } from '@/hooks/useAuthStore';

interface SidebarProps {
  currentView?: 'dashboard' | 'summary' | 'planning' | 'analytics';
  onViewChange?: (view: 'dashboard' | 'summary' | 'planning' | 'analytics') => void;
}

const SidebarIcon = ({ 
  icon, 
  active = false,
  onClick,
  tooltip
}: { 
  icon: React.ReactNode; 
  active?: boolean;
  onClick?: () => void;
  tooltip: string;
}) => (
  <div 
    onClick={onClick}
    title={tooltip}
    className={`relative group flex items-center justify-center w-12 h-12 md:w-full md:aspect-square rounded-2xl cursor-pointer transition-all duration-300 ${
      active 
        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' 
        : 'text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'
    }`}
  >
    {icon}
    {/* Modern CSS Tooltip (Hidden on mobile) */}
    <div className="absolute hidden md:block left-24 scale-0 group-hover:scale-100 transition-all duration-200 origin-left bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap z-50 pointer-events-none">
      {tooltip}
    </div>
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView = 'dashboard', onViewChange }) => {
  const { language, t } = useTranslation();
  const logout = useAuthStore((state) => state.logout);

  return (
    <aside className="fixed bottom-0 left-0 right-0 top-auto h-16 w-full md:top-0 md:bottom-auto md:h-full md:w-24 bg-white border-t border-gray-100 md:border-t-0 md:border-r flex flex-row md:flex-col items-center justify-between md:justify-start py-0 px-6 md:py-8 md:px-0 z-50 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] md:shadow-[4px_0_24px_rgba(0,0,0,0.02)] animate-fadeIn">
      {/* Brand Logo (Visible on desktop only) */}
      <div 
        className="hidden md:flex w-12 h-12 bg-gradient-to-br from-emerald-700 to-emerald-500 rounded-2xl items-center justify-center text-white font-bold text-2xl mb-12 shadow-lg shadow-emerald-200 cursor-pointer hover:rotate-3 transition-transform"
        onClick={() => onViewChange?.('dashboard')}
        title="POS System"
      >
        F
      </div>
      
      {/* Usable Nav Menus Only */}
      <nav className="flex flex-row md:flex-col space-x-6 md:space-x-0 md:space-y-5 px-0 md:px-6 h-full md:h-auto items-center md:items-stretch justify-start flex-1 md:flex-initial md:w-full">
        <SidebarIcon 
          icon={<LayoutDashboard size={22} />} 
          active={currentView === 'dashboard'} 
          onClick={() => onViewChange?.('dashboard')}
          tooltip={t.dashboard}
        />
        <SidebarIcon 
          icon={<FolderOpen size={22} />} 
          active={currentView === 'summary'} 
          onClick={() => onViewChange?.('summary')}
          tooltip={t.expenseSummary}
        />
        <SidebarIcon 
          icon={<Target size={22} />} 
          active={currentView === 'planning'} 
          onClick={() => onViewChange?.('planning')}
          tooltip={language === 'en' ? 'Budgets & Goals' : 'งบประมาณและเป้าหมาย'}
        />
        <SidebarIcon 
          icon={<BarChart3 size={22} />} 
          active={currentView === 'analytics'} 
          onClick={() => onViewChange?.('analytics')}
          tooltip={language === 'en' ? 'Financial Analytics' : 'วิเคราะห์การเงิน'}
        />
      </nav>
      
      {/* Usable Logout Button */}
      <div className="pb-0 md:pb-6 w-auto md:w-full px-0 md:px-6 flex flex-row md:flex-col items-center space-x-4 md:space-x-0 md:space-y-4">
        <SidebarIcon 
          icon={<LogOut size={22} />} 
          onClick={logout}
          tooltip={language === 'en' ? 'Log Out' : 'ออกจากระบบ'}
        />
        <div className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
          POS v1
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
