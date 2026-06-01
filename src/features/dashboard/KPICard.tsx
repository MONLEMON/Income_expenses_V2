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
  <div className={`p-6 rounded-2xl shadow-sm border transition-all duration-300 group ${
    isDarkTheme 
      ? 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 border-emerald-800 hover:shadow-lg hover:shadow-emerald-900/10 hover:border-emerald-700' 
      : 'bg-white border-gray-100 hover:shadow-lg hover:shadow-emerald-50 hover:border-emerald-200/60'
  }`}>
    <div className="flex justify-between items-start mb-4">
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
    <h3 className={`text-sm font-medium mb-1 ${isDarkTheme ? 'text-emerald-200/80' : 'text-gray-500'}`}>{title}</h3>
    <p className={`text-2xl font-bold tracking-tight ${isDarkTheme ? 'text-white' : amountClassName}`}>
      ฿{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </p>
  </div>
);

export default KPICard;
