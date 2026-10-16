'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '@/hooks/useLanguageStore';

export interface CategoryExpenseData {
  name: string;
  value: number;
  percentage: string;
  color: string;
}

interface CategoryExpenseChartProps {
  data: CategoryExpenseData[];
  totalExpenses: number;
  onSelectCategory?: (category: string) => void;
}

const CategoryExpenseChart: React.FC<CategoryExpenseChartProps> = ({ data, totalExpenses, onSelectCategory }) => {
  const { language, t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg hover:shadow-emerald-50/20 transition-all duration-300 flex flex-col animate-fadeIn min-w-0">
      <div className="mb-2">
        <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">{t.expenseByCategory}</h2>
        <p className="text-[11px] sm:text-sm text-slate-500 font-medium mt-0.5 font-sans">
          {language === 'en' ? 'Tap a category to inspect transactions' : 'แตะที่หมวดหมู่เพื่อดูรายการใช้จ่ายย่อย'}
        </p>
      </div>

      <div className="h-[195px] sm:h-[220px] w-full relative mt-1">
        {mounted ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={74}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                  onClick={(entry) => {
                    if (entry?.name && onSelectCategory) {
                      onSelectCategory(entry.name);
                    }
                  }}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-90 transition-opacity cursor-pointer outline-none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    borderRadius: '14px',
                    border: '1px solid #f1f5f9',
                    boxShadow: '0 10px 20px -5px rgb(0 0 0 / 0.1)',
                    padding: '10px 14px'
                  }}
                  formatter={(val: any) => [`฿${val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-0.5">
                {language === 'en' ? 'Total Spend' : 'ยอดจ่ายรวม'}
              </p>
              <p className="text-base sm:text-xl font-black text-slate-900 font-sans">
                ฿{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-slate-50 rounded-2xl animate-pulse flex items-center justify-center border border-dashed border-slate-200">
            <span className="text-xs text-slate-400 font-semibold font-sans">
              {language === 'en' ? 'Loading Breakdown...' : 'กำลังประมวลผล...'}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:gap-2 max-h-[165px] overflow-y-auto pr-1">
        {data.map((item) => (
          <div 
            key={item.name} 
            onClick={() => onSelectCategory?.(item.name)}
            className="flex flex-col p-2 sm:p-2.5 rounded-xl border border-slate-100/70 hover:border-emerald-200 hover:bg-emerald-50/30 active:scale-[0.98] transition-all duration-200 bg-slate-50/50 cursor-pointer select-none"
          >
            <div className="flex items-center space-x-1.5 mb-1">
              <div className="w-2 h-2 rounded-full shadow-sm shrink-0" style={{ backgroundColor: item.color }}></div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-700 truncate">
                {t[item.name as keyof typeof t] || item.name}
              </span>
            </div>
            <div className="flex justify-between items-baseline pl-3">
              <span className="text-xs sm:text-sm font-black text-slate-900 font-sans truncate">
                ฿{item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[9px] sm:text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100/60 shrink-0">
                {item.percentage}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryExpenseChart;
