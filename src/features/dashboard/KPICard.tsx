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
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  amount, 
  trend, 
  isPositive, 
  icon: Icon, 
  color,
  amountClassName = "text-gray-800",
  isDarkTheme = false
}) => (
  <div className={`p-6 rounded-2xl shadow-sm border transition-all duration-300 relative overflow-hidden group ${
    isDarkTheme 
      ? 'bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 border-emerald-800/80 hover:shadow-xl hover:shadow-emerald-900/20 hover:border-emerald-600/60' 
      : 'bg-white/80 backdrop-blur-md border-slate-100/80 hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-200/60'
  }`}>
    {/* Light reflection blur mesh */}
    <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl pointer-events-none transition-all duration-500 group-hover:scale-150 ${
      isDarkTheme ? 'bg-emerald-500/10' : 'bg-emerald-100/30'
    }`} />

    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-3 rounded-xl shadow-sm group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
          isDarkTheme
            ? 'bg-emerald-500/20 text-emerald-300'
            : isPositive 
              ? 'bg-emerald-50 text-emerald-600' 
              : 'bg-rose-50 text-rose-600'
        }`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{trend}%</span>
        </div>
      )}
    </div>
    <h3 className={`text-sm font-medium mb-1 relative z-10 ${isDarkTheme ? 'text-emerald-200/80' : 'text-slate-500'}`}>{title}</h3>
    <p className={`text-2xl font-bold tracking-tight relative z-10 ${isDarkTheme ? 'text-white' : amountClassName}`}>
      ฿{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </p>
  </div>
);

export default KPICard;
