'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '@/hooks/useLanguageStore';

export interface ChartData {
  name: string;
  income: number;
  expenses: number;
}

interface IncomeExpenseChartProps {
  data: ChartData[];
  selectedYear: string;
  onYearChange: (year: string) => void;
}

const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({ data, selectedYear, onYearChange }) => {
  const { language, t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="lg:col-span-2 bg-white p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg hover:shadow-emerald-50/20 transition-all duration-300 animate-fadeIn min-w-0">
      <div className="flex flex-col gap-2 mb-4 sm:mb-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate">
            {language === 'en' ? 'Income vs Expenses' : 'รายรับ เทียบกับ รายจ่าย'}
          </h2>
          <select 
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 sm:px-4 sm:py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-700 font-bold cursor-pointer shadow-sm outline-none transition-all shrink-0"
          >
            <option value="2026">{language === 'en' ? 'Year 2026' : 'ปี 2026'}</option>
            <option value="2025">{language === 'en' ? 'Year 2025' : 'ปี 2025'}</option>
            <option value="2024">{language === 'en' ? 'Year 2024' : 'ปี 2024'}</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] sm:text-sm text-slate-500 font-medium font-sans">
            {language === 'en' ? 'Monthly financial overview (6 Months)' : 'ภาพรวมการเงินรายเดือน (6 เดือนล่าสุด)'}
          </p>
          {/* Mini Legend Indicators */}
          <div className="flex items-center gap-3 text-[11px] sm:text-xs font-bold">
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-md">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {t.income}
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 bg-rose-50/80 px-2 py-0.5 rounded-md">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {t.expense}
            </span>
          </div>
        </div>
      </div>

      <div className="h-[220px] sm:h-[290px] md:h-[330px]">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={4} margin={{ top: 10, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11, fontWeight: 600}} dy={6} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                width={52}
                tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 600}} 
                tickFormatter={(v) => v >= 1000 ? `฿${(v / 1000).toFixed(0)}k` : `฿${v}`} 
              />
              <Tooltip 
                cursor={{fill: '#ECFDF5', opacity: 0.4}}
                contentStyle={{borderRadius: '14px', border: '1px solid #f1f5f9', boxShadow: '0 10px 20px -5px rgb(0 0 0 / 0.1)', padding: '10px 14px'}}
                formatter={(val: any) => [`฿${val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, '']}
              />
              <Bar dataKey="income" name={t.income} fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
              <Bar dataKey="expenses" name={t.expense} fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full bg-slate-50 rounded-2xl animate-pulse flex items-center justify-center border border-dashed border-slate-200">
            <span className="text-xs text-slate-400 font-semibold font-sans">
              {language === 'en' ? 'Loading Chart...' : 'กำลังโหลดแผนภูมิ...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeExpenseChart;
