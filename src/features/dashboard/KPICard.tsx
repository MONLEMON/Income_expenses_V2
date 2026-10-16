import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KPICardProps {
  title: string;
  amount: number;
  trend: number | undefined;
  isPositive: boolean;
  icon: React.ElementType;
  color: string; // Used for icon background badge
  amountClassName?: string;
  isDarkTheme?: boolean;
  className?: string;
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  amount, 
  trend, 
  isPositive, 
  icon: Icon, 
  color,
  amountClassName = "text-slate-900",
  isDarkTheme = false,
  className = ""
}) => (
  <div className={`p-3.5 sm:p-5 md:p-6 rounded-2xl md:rounded-3xl shadow-sm border transition-all duration-300 relative overflow-hidden group ${
    isDarkTheme 
      ? 'bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 border-emerald-800/80 hover:shadow-xl hover:shadow-emerald-900/20 hover:border-emerald-600/60' 
      : 'bg-white/90 backdrop-blur-md border-slate-100/90 hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-200/60'
  } ${className}`}>
    {/* Ambient Glow */}
    <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl pointer-events-none transition-all duration-500 group-hover:scale-150 ${
      isDarkTheme ? 'bg-emerald-500/15' : 'bg-emerald-100/40'
    }`} />

    <div className="flex justify-between items-start mb-2.5 sm:mb-3 md:mb-4 relative z-10">
      <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-sm group-hover:scale-105 group-hover:-rotate-2 transition-transform duration-300 ${color}`}>
        <Icon className="text-white w-4 h-4 sm:w-6 sm:h-6" />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center space-x-0.5 sm:space-x-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black ${
          isDarkTheme
            ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
            : isPositive 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
              : 'bg-rose-50 text-rose-600 border border-rose-100'
        }`}>
          {isPositive ? <ArrowUpRight size={11} className="sm:w-3.5 sm:h-3.5" /> : <ArrowDownRight size={11} className="sm:w-3.5 sm:h-3.5" />}
          <span>{trend}%</span>
        </div>
      )}
    </div>

    <h3 className={`text-[11px] sm:text-sm font-bold tracking-tight mb-0.5 sm:mb-1 relative z-10 truncate ${isDarkTheme ? 'text-emerald-200/90' : 'text-slate-500'}`}>
      {title}
    </h3>
    <p className={`font-black tracking-tight relative z-10 font-sans truncate ${
      isDarkTheme ? 'text-2xl sm:text-2xl text-white' : `text-base sm:text-2xl ${amountClassName}`
    }`}>
      ฿{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </p>
  </div>
);

export default KPICard;
