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
    <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:shadow-emerald-50/20 transition-all duration-300 animate-fadeIn min-w-0">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-extrabold !text-black drop-shadow-sm">
            {language === 'en' ? 'Income vs Expenses' : 'รายรับ เทียบกับ รายจ่าย'}
          </h2>
          <p className="text-sm text-gray-700 mt-1 font-medium font-sans">
            {language === 'en' ? 'Monthly financial overview (6 Months)' : 'ภาพรวมทางการเงินรายเดือน (ย้อนหลัง 6 เดือน)'}
          </p>
        </div>
        <select 
          value={selectedYear}
          onChange={(e) => onYearChange(e.target.value)}
          className="text-sm bg-white border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-700 font-medium cursor-pointer shadow-sm outline-none transition-all"
        >
          <option value="2026">{language === 'en' ? 'Yearly 2026' : 'ประจำปี 2026'}</option>
          <option value="2025">{language === 'en' ? 'Yearly 2025' : 'ประจำปี 2025'}</option>
          <option value="2024">{language === 'en' ? 'Yearly 2024' : 'ประจำปี 2024'}</option>
        </select>
      </div>
      <div className="h-[350px]">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={8} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 500}} dy={10} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                width={75}
                tick={{fill: '#94A3B8', fontSize: 12, fontWeight: 500}} 
                tickFormatter={(v) => `฿${v.toLocaleString()}`} 
              />
              <Tooltip 
                cursor={{fill: '#ECFDF5', opacity: 0.4}}
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                formatter={(val: any) => [`฿${val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, '']}
              />
              <Bar dataKey="income" name={t.income} fill="#10b981" radius={[6, 6, 0, 0]} barSize={22} />
              <Bar dataKey="expenses" name={t.expense} fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full bg-slate-50 rounded-2xl animate-pulse flex items-center justify-center border border-dashed border-slate-200">
            <span className="text-xs text-slate-400 font-semibold font-sans">
              {language === 'en' ? 'Loading Income vs Expenses Chart...' : 'กำลังโหลดแผนภูมิรายรับ-รายจ่าย...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeExpenseChart;
