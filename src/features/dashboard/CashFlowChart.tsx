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
}

const CategoryExpenseChart: React.FC<CategoryExpenseChartProps> = ({ data, totalExpenses }) => {
  const { language, t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:shadow-emerald-50/20 transition-all duration-300 flex flex-col animate-fadeIn min-w-0">
      <div className="mb-4">
        <h2 className="text-xl font-extrabold !text-black drop-shadow-sm">{t.expenseByCategory}</h2>
        <p className="text-sm text-gray-700 mt-1 font-medium">
          {language === 'en' ? 'Breakdown of current monthly spend' : 'สัดส่วนและภาพรวมของค่าใช้จ่ายรายเดือนของคุณ'}
        </p>
      </div>

      <div className="h-[220px] w-full relative mt-4">
        {mounted ? (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55} // Safe and elegant 3:4 ratio to avoid clipping
                  outerRadius={75} // Safe and elegant 3:4 ratio to avoid clipping
                  paddingAngle={4}
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-90 transition-opacity cursor-pointer outline-none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '10px 14px'
                  }}
                  formatter={(val: any) => [`฿ ${val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                {language === 'en' ? 'Total Spend' : 'ยอดจ่ายรวม'}
              </p>
              <p className="text-xl font-extrabold text-gray-800 font-sans">
                ฿ {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
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

      <div className="mt-6 grid grid-cols-2 gap-2">
        {data.map((item) => (
          <div 
            key={item.name} 
            className="flex flex-col p-2.5 rounded-xl border border-transparent hover:border-emerald-100 hover:bg-emerald-50/20 transition-all duration-200"
          >
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: item.color }}></div>
              <span className="text-xs font-semibold text-gray-600 truncate">
                {t[item.name as keyof typeof t] || item.name}
              </span>
            </div>
            <div className="flex justify-between items-baseline pl-4">
              <span className="text-sm font-bold text-gray-800 font-sans">
                ฿ {item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] font-medium text-emerald-600/80 bg-emerald-50 px-1.5 py-0.5 rounded">
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
