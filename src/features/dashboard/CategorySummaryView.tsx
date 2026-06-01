'use client';

import React, { useMemo } from 'react';
import { 
  Utensils, 
  ShoppingBag, 
  Car, 
  Tv, 
  Zap, 
  HelpCircle, 
  ArrowRight,
  TrendingDown,
  Inbox
} from 'lucide-react';
import { Progress } from 'antd';
import type { Transaction } from '@/hooks/useTransactions';
import { useTranslation } from '@/hooks/useLanguageStore';

// --- Category to Icon and Red Gradient Map ---
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Food & Dining': Utensils,
  'food & dining': Utensils,
  'food': Utensils,
  'Shopping': ShoppingBag,
  'shopping': ShoppingBag,
  'Transportation': Car,
  'transportation': Car,
  'Entertainment': Tv,
  'entertainment': Tv,
  'Bills & Utilities': Zap,
  'bills & utilities': Zap,
  'Other Expenses': HelpCircle,
  'other expenses': HelpCircle,
  'other': HelpCircle,
  'ohter': HelpCircle,            // Support database typo
  'drink': Utensils,             // Drink uses utensils
  'sevice': Zap,                 // Service uses zap (database typo)
  'service': Zap,
  'all': Inbox
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  'Food & Dining': 'from-rose-800 to-rose-950',
  'food & dining': 'from-rose-800 to-rose-950',
  'food': 'from-rose-800 to-rose-950',
  'Shopping': 'from-rose-500 to-rose-700',
  'shopping': 'from-rose-500 to-rose-700',
  'Transportation': 'from-red-600 to-red-800',
  'transportation': 'from-red-600 to-red-800',
  'Entertainment': 'from-rose-700 to-rose-900',
  'entertainment': 'from-rose-700 to-rose-900',
  'Bills & Utilities': 'from-rose-600 to-rose-800',
  'bills & utilities': 'from-rose-600 to-rose-800',
  'Other Expenses': 'from-rose-400 to-rose-600',
  'other expenses': 'from-rose-400 to-rose-600',
  'other': 'from-rose-400 to-rose-600',
  'ohter': 'from-rose-400 to-rose-600',
  'drink': 'from-cyan-600 to-cyan-800',
  'sevice': 'from-indigo-600 to-indigo-800',
  'service': 'from-indigo-600 to-indigo-800',
  'all': 'from-pink-600 to-pink-800'
};

interface CategorySummaryViewProps {
  transactions: Transaction[];
  onSelectCategory: (category: string) => void;
  selectedMonth: string;
  selectedYear: string;
}

const CategorySummaryView: React.FC<CategorySummaryViewProps> = ({ 
  transactions, 
  onSelectCategory,
  selectedMonth,
  selectedYear
}) => {
  const { language, t } = useTranslation();
  
  // Format selected month name dynamically based on locale
  const periodName = useMemo(() => {
    if (selectedMonth === 'ALL') {
      return language === 'en' ? `Year ${selectedYear}` : `ปี ${selectedYear}`;
    }
    const dateObj = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1);
    const monthName = dateObj.toLocaleDateString(language === 'en' ? 'en-US' : 'th-TH', { month: 'long' });
    return `${monthName} ${selectedYear}`;
  }, [selectedMonth, selectedYear, language]);

  // Calculate category aggregates dynamically
  const aggregates = useMemo(() => {
    const expenseTx = transactions.filter(t => t.amount < 0);
    const totalSpent = Math.abs(expenseTx.reduce((sum, t) => sum + t.amount, 0));
    
    // Group spends and counts
    const groups: Record<string, { total: number; count: number }> = {};
    
    expenseTx.forEach(t => {
      const cat = t.category || 'Other Expenses';
      if (!groups[cat]) {
        groups[cat] = { total: 0, count: 0 };
      }
      groups[cat].total += Math.abs(t.amount);
      groups[cat].count += 1;
    });

    // Format results
    return Object.entries(groups).map(([name, data]) => {
      const percentage = totalSpent > 0 ? (data.total / totalSpent) * 100 : 0;
      return {
        name,
        total: data.total,
        count: data.count,
        percentage,
        icon: CATEGORY_ICONS[name] || CATEGORY_ICONS[name.toLowerCase()] || HelpCircle,
        gradient: CATEGORY_GRADIENTS[name] || CATEGORY_GRADIENTS[name.toLowerCase()] || 'from-rose-500 to-rose-700'
      };
    }).sort((a, b) => b.total - a.total);
  }, [transactions]);

  const totalExpenseSum = useMemo(() => {
    return Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
  }, [transactions]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner Overview with Dynamic Months title (Red Outflow Themed) */}
      <div className="bg-gradient-to-r from-rose-900 to-rose-950 p-6 md:p-8 rounded-3xl text-white shadow-md border border-rose-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fadeIn">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
            {t.overview}
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
            {language === 'en' ? `${periodName} Outflows` : `รายจ่ายประจำ${periodName}`}
          </h2>
          <p className="text-sm text-rose-200/80 mt-1 font-medium font-sans">
            {language === 'en' 
              ? `Categorized cost analysis and detailed transaction inspector for ${periodName}`
              : `การวิเคราะห์รายจ่ายตามหมวดหมู่และตัวตรวจสอบรายละเอียดของ${periodName}`}
          </p>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/20 px-5 py-3 rounded-2xl text-right">
          <p className="text-[10px] text-rose-300 font-bold uppercase tracking-wider">
            {language === 'en' 
              ? `Outflows for ${selectedMonth === 'ALL' ? 'Period' : 'Month'}` 
              : `ยอดจ่ายรวมราย${selectedMonth === 'ALL' ? 'รอบปี' : 'เดือน'}`}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <TrendingDown className="w-5 h-5 text-rose-300 animate-pulse" />
            <span className="text-2xl font-extrabold text-white font-sans">
              ฿{totalExpenseSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {aggregates.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
          <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-800">{t.noExpenseRecords}</h3>
          <p className="text-sm text-gray-500 mt-1 font-sans">
            {t.noExpenseRecordsDesc.replace('{period}', periodName)}
          </p>
        </div>
      ) : (
        /* Grid of Category cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {aggregates.map((cat) => {
            const Icon = cat.icon;
            return (
              <div 
                key={cat.name}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:shadow-rose-50/20 hover:border-rose-200/50 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-5">
                    <div className={`p-3.5 rounded-xl bg-gradient-to-br ${cat.gradient} text-white shadow-sm group-hover:scale-110 group-hover:-rotate-2 transition-transform duration-300`}>
                      <Icon size={22} />
                    </div>
                    <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                      {language === 'en' 
                        ? `${cat.count} ${cat.count === 1 ? t.transactionCount : t.transactionsCount}`
                        : `${cat.count} ${t.transactionCount}`}
                    </span>
                  </div>
                  
                  <h3 className="text-gray-800 font-extrabold text-lg tracking-tight drop-shadow-sm mb-1">
                    {t[cat.name as keyof typeof t] || cat.name}
                  </h3>
                  <p className="text-2xl font-extrabold text-rose-900 tracking-tight font-sans">
                    ฿{cat.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-50 space-y-3">
                  {/* Progress Indicator */}
                  <div>
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
                      <span>{t.outflowShare}</span>
                    </div>
                    <Progress 
                      percent={parseFloat(cat.percentage.toFixed(1))} 
                      strokeColor="#f43f5e" // Soft Rose Red for Outflow Progress
                      railColor="#f1f5f9"
                      size={['100%', 8]}
                      format={(val) => `${val?.toFixed(1)}%`}
                      className="font-bold text-xs"
                    />
                  </div>

                  {/* Dynamic Inspector link */}
                  <button 
                    onClick={() => onSelectCategory(cat.name)}
                    className="w-full mt-2 flex items-center justify-between text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-600 hover:text-white px-4 py-2.5 rounded-xl transition-all cursor-pointer border border-transparent hover:shadow-md animate-fadeIn"
                  >
                    <span>{t.viewDetails}</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategorySummaryView;
