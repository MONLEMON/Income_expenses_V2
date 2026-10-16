'use client';

import React from 'react';
import { LayoutDashboard, FolderOpen, LogOut, Target, BarChart3, Plus, CalendarDays } from 'lucide-react';
import { useTranslation } from '@/hooks/useLanguageStore';
import { useAuthStore } from '@/hooks/useAuthStore';

export type NavViewType = 'dashboard' | 'calendar' | 'summary' | 'planning' | 'analytics';

interface SidebarProps {
  currentView?: NavViewType;
  onViewChange?: (view: NavViewType) => void;
  onAddTransaction?: () => void;
}

const desktopNavItems: Array<{
  id: NavViewType;
  icon: React.ElementType;
  labelEn: string;
  labelTh: string;
}> = [
  { id: 'dashboard', icon: LayoutDashboard, labelEn: 'Dashboard', labelTh: 'ภาพรวม' },
  { id: 'calendar', icon: CalendarDays, labelEn: 'Calendar', labelTh: 'ปฏิทินรายวัน' },
  { id: 'summary', icon: FolderOpen, labelEn: 'Summary', labelTh: 'หมวดหมู่' },
  { id: 'planning', icon: Target, labelEn: 'Planning', labelTh: 'แผนงบ/ออม' },
  { id: 'analytics', icon: BarChart3, labelEn: 'Analytics', labelTh: 'วิเคราะห์' },
];

const mobileNavItems: Array<{
  id: NavViewType;
  icon: React.ElementType;
  labelEn: string;
  labelTh: string;
}> = [
  { id: 'dashboard', icon: LayoutDashboard, labelEn: 'Dashboard', labelTh: 'ภาพรวม' },
  { id: 'summary', icon: FolderOpen, labelEn: 'Summary', labelTh: 'หมวดหมู่' },
  { id: 'planning', icon: Target, labelEn: 'Planning', labelTh: 'แผนงบ/ออม' },
  { id: 'analytics', icon: BarChart3, labelEn: 'Analytics', labelTh: 'วิเคราะห์' },
];

const Sidebar: React.FC<SidebarProps> = ({ currentView = 'dashboard', onViewChange, onAddTransaction }) => {
  const { language } = useTranslation();
  const logout = useAuthStore((state) => state.logout);

  const renderMobileNavButton = (item: typeof mobileNavItems[number]) => {
    const Icon = item.icon;
    // Highlight 'dashboard' tab on mobile dock when in either 'dashboard' or 'calendar' sub-mode
    const isActive = currentView === item.id || (item.id === 'dashboard' && currentView === 'calendar');
    const label = language === 'en' ? item.labelEn : item.labelTh;

    return (
      <button
        key={item.id}
        onClick={() => onViewChange?.(item.id)}
        className={`flex flex-col items-center justify-center h-full py-1 transition-all duration-150 relative cursor-pointer active:scale-90 select-none ${
          isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        {/* Active Pill Glow Indicator */}
        <div 
          className={`flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
            isActive ? 'bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100' : 'text-slate-400'
          }`}
        >
          <Icon size={20} className={isActive ? 'scale-105' : ''} />
        </div>
        <span className={`text-[10px] font-extrabold tracking-tight mt-0.5 truncate max-w-[64px] ${isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
          {label}
        </span>

        {/* Tiny Active Dot under text */}
        {isActive && (
          <span className="absolute bottom-1 w-1 h-1 bg-emerald-600 rounded-full animate-fadeIn" />
        )}
      </button>
    );
  };

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-24 bg-white border-r border-slate-100 flex-col items-center justify-between py-8 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] animate-fadeIn">
        {/* Brand Logo */}
        <div 
          className="w-12 h-12 bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-200 cursor-pointer hover:scale-105 active:scale-95 transition-all"
          onClick={() => onViewChange?.('dashboard')}
          title="POS Financials"
        >
          F
        </div>
        
        {/* Desktop Nav Icons */}
        <nav className="flex flex-col space-y-3.5 px-3 w-full">
          {desktopNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            const label = language === 'en' ? item.labelEn : item.labelTh;

            return (
              <div 
                key={item.id}
                onClick={() => onViewChange?.(item.id)}
                title={label}
                className={`relative group flex flex-col items-center justify-center w-full aspect-square rounded-2xl cursor-pointer transition-all duration-200 select-none ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' 
                    : 'text-slate-400 hover:bg-emerald-50/80 hover:text-emerald-700'
                }`}
              >
                <Icon size={22} className="transition-transform group-hover:scale-110" />
                
                {/* Modern Tooltip on Hover */}
                <div className="absolute left-24 scale-0 group-hover:scale-100 transition-all duration-150 origin-left bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap z-50 pointer-events-none">
                  {label}
                </div>
              </div>
            );
          })}
        </nav>
        
        {/* Desktop Logout Button */}
        <div className="w-full px-3 flex flex-col items-center space-y-3">
          <div 
            onClick={logout}
            title={language === 'en' ? 'Log Out' : 'ออกจากระบบ'}
            className="group flex items-center justify-center w-full aspect-square rounded-2xl cursor-pointer text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200"
          >
            <LogOut size={22} className="transition-transform group-hover:scale-110" />
          </div>
          <div className="text-[10px] font-extrabold text-slate-300 uppercase tracking-wider select-none">
            v2.0
          </div>
        </div>
      </aside>

      {/* ================= MOBILE BOTTOM NAVIGATION DOCK ================= */}
      <nav 
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] pb-safe print:hidden"
      >
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto items-center px-1.5">
          {renderMobileNavButton(mobileNavItems[0])}
          {renderMobileNavButton(mobileNavItems[1])}

          {/* Center Quick-Add Transaction Action Button */}
          <div className="flex flex-col items-center justify-center h-full relative">
            <button
              type="button"
              onClick={onAddTransaction}
              aria-label={language === 'en' ? 'Add Transaction' : 'เพิ่มรายการใหม่'}
              className="w-12 h-12 -mt-5 bg-gradient-to-tr from-emerald-700 via-emerald-600 to-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/35 border-4 border-white flex items-center justify-center active:scale-90 transition-all cursor-pointer select-none"
            >
              <Plus size={24} strokeWidth={2.75} />
            </button>
            <span className="text-[10px] font-black text-emerald-700 tracking-tight mt-0.5 select-none">
              {language === 'en' ? 'Add' : 'เพิ่มรายการ'}
            </span>
          </div>

          {renderMobileNavButton(mobileNavItems[2])}
          {renderMobileNavButton(mobileNavItems[3])}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;


