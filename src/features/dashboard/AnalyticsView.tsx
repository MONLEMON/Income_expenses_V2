'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Printer, 
  AlertCircle,
  Inbox,
  PieChart
} from 'lucide-react';
import { useTranslation } from '@/hooks/useLanguageStore';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Spin } from 'antd';

type DatePreset = 'thisMonth' | 'lastMonth' | 'last90Days' | 'thisYear' | 'custom';

// Helpers to compute standard ISO date strings
const getPresetDates = (preset: DatePreset, customStart?: string, customEnd?: string) => {
  const today = new Date();
  let start = new Date();
  let end = new Date();

  switch (preset) {
    case 'thisMonth':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = today;
      break;
    case 'lastMonth':
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    case 'last90Days':
      start = new Date();
      start.setDate(today.getDate() - 90);
      end = today;
      break;
    case 'thisYear':
      start = new Date(today.getFullYear(), 0, 1);
      end = today;
      break;
    case 'custom':
      if (customStart && customEnd) {
        return { start: customStart, end: customEnd };
      }
      break;
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
};

const AnalyticsView: React.FC = () => {
  const { language, t } = useTranslation();
  
  // Date states
  const [preset, setPreset] = useState<DatePreset>('thisMonth');
  
  // Set default custom dates as 30 days range
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [customStart, setCustomStart] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().split('T')[0]);

  // Client mounting to avoid hydration warnings with Recharts in SSR
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute active range
  const activeRange = useMemo(() => {
    return getPresetDates(preset, customStart, customEnd);
  }, [preset, customStart, customEnd]);

  // Fetch Analytics data
  const { data, isLoading, isError, error } = useAnalytics(activeRange.start, activeRange.end);

  // CSV Exporter Action
  const [isExporting, setIsExporting] = useState(false);
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const token = useAuthStore.getState().token;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Query raw transaction list matching the dates
      const res = await fetch(`/api/transactions?startDate=${activeRange.start}&endDate=${activeRange.end}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch transactions list for export');

      const transactions = await res.json();
      
      // Define CSV Headers
      const csvHeaders = language === 'en' 
        ? ['ID', 'Date', 'Description', 'Type', 'Category', 'Amount (THB)', 'Outflow Share']
        : ['ลำดับ', 'วันที่', 'รายการ/คำอธิบาย', 'ประเภท', 'หมวดหมู่', 'จำนวนเงิน (บาท)', 'สัดส่วน'];

      // Map rows
      const csvRows = transactions.map((t: any, index: number) => [
        index + 1,
        t.date,
        t.item.replace(/"/g, '""'), // Escape double quotes
        t.type === 'Income' ? (language === 'en' ? 'Income' : 'รายรับ') : (language === 'en' ? 'Expense' : 'รายจ่าย'),
        t.category,
        Math.abs(t.amount),
        t.contribution
      ]);

      // Combine with UTF-8 BOM prefix (\uFEFF) to guarantee Excel displays Thai characters perfectly
      const csvContent = '\uFEFF' + [
        csvHeaders.join(','),
        ...csvRows.map((r: any[]) => r.map(val => `"${val}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `financial_report_${activeRange.start}_to_${activeRange.end}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error(err);
      alert('Failed to export CSV report');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Compute variance indicator values
  const renderVariance = (val: number | null, isExpense = false) => {
    if (val === null) return null;
    const isIncrease = val > 0;
    
    // For expenses: decrease is good (green), increase is bad (red)
    // For income/profits: increase is good (green), decrease is bad (red)
    let isPositive = isIncrease;
    if (isExpense) {
      isPositive = !isIncrease;
    }

    const colorClass = isPositive ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-rose-500 bg-rose-50 border-rose-100';
    const Icon = isIncrease ? ArrowUpRight : ArrowDownRight;

    return (
      <span className={`inline-flex items-center space-x-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${colorClass} mt-1 print:border-none print:p-0`}>
        <Icon size={12} />
        <span>{Math.abs(val).toFixed(1)}%</span>
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse">
        <Spin size="large" />
        <span className="text-xs text-slate-400 font-bold mt-4 uppercase tracking-wider">
          {language === 'en' ? 'Compiling Financial Metrics...' : 'กำลังวิเคราะห์ผลกระแสเงินสด...'}
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-rose-100 text-center max-w-md mx-auto py-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-800 mb-2">{language === 'en' ? 'Analytics Error' : 'เกิดข้อผิดพลาดในการดึงข้อมูล'}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          {error?.message || 'Unable to compute analytics data from database.'}
        </p>
      </div>
    );
  }

  const { dailyTrends = [], kpis, comparison, breakdowns } = data!;

  return (
    <div className="space-y-8 animate-fadeIn text-slate-800">
      
      {/* --- 1. FILTER CONTROLS BAR (Hidden during prints) --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm print:hidden">
        
        {/* Preset Selectors */}
        <div className="flex flex-wrap gap-2">
          {(['thisMonth', 'lastMonth', 'last90Days', 'thisYear', 'custom'] as DatePreset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                preset === p
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              {t[p as keyof typeof t] || p}
            </button>
          ))}
        </div>

        {/* Custom Range Picker & Export Tools */}
        <div className="flex flex-wrap items-center gap-3">
          {preset === 'custom' && (
            <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <Calendar size={14} className="text-slate-400" />
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none border-none cursor-pointer text-slate-700"
              />
              <span className="text-[10px] font-bold text-slate-400 font-sans">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none border-none cursor-pointer text-slate-700"
              />
            </div>
          )}

          {/* Export Action Buttons */}
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            title={t.exportCsv}
          >
            <Download size={15} />
            <span>{language === 'en' ? 'CSV' : 'ส่งออก CSV'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
            title={t.printReport}
          >
            <Printer size={15} />
            <span>{language === 'en' ? 'Print' : 'พิมพ์รายงาน'}</span>
          </button>
        </div>
      </div>

      {/* Printable Report Header metadata (Visible on print layout only) */}
      <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">{t.financialAnalytics}</h1>
        <p className="text-sm font-semibold text-slate-500 mt-1">
          {language === 'en' ? 'Reporting Period:' : 'รอบระยะเวลารายงาน:'} {activeRange.start} {language === 'en' ? 'to' : 'ถึง'} {activeRange.end} ({kpis.diffDays} {language === 'en' ? 'days' : 'วัน'})
        </p>
      </div>

      {/* --- 2. STATS KPI GRID PANEL --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* KPI 1: Inflows */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between print:border-none print:shadow-none print:p-0">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t.monthlyIncome}</span>
            <span className="text-lg font-extrabold text-emerald-600 mt-1 block">฿{kpis.totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between items-baseline mt-3 border-t border-slate-50 pt-2 print:border-none">
            <span className="text-[9px] text-slate-400 font-semibold truncate font-sans">{t.comparePriorPeriod}</span>
            {renderVariance(comparison.incomeChange)}
          </div>
        </div>

        {/* KPI 2: Outflows */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between print:border-none print:shadow-none print:p-0">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t.monthlyExpenses}</span>
            <span className="text-lg font-extrabold text-rose-500 mt-1 block">฿{kpis.totalExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div className="flex justify-between items-baseline mt-3 border-t border-slate-50 pt-2 print:border-none">
            <span className="text-[9px] text-slate-400 font-semibold truncate font-sans">{t.comparePriorPeriod}</span>
            {renderVariance(comparison.expenseChange, true)}
          </div>
        </div>

        {/* KPI 3: Net Profit */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between print:border-none print:shadow-none print:p-0">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t.totalBalance}</span>
            <span className={`text-lg font-extrabold mt-1 block ${kpis.netProfit >= 0 ? 'text-slate-800' : 'text-rose-500'}`}>
              ฿{kpis.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex justify-between items-baseline mt-3 border-t border-slate-50 pt-2 print:border-none">
            <span className="text-[9px] text-slate-400 font-semibold truncate font-sans">{t.comparePriorPeriod}</span>
            {renderVariance(comparison.profitChange)}
          </div>
        </div>

        {/* KPI 4: Profit Margin */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between print:border-none print:shadow-none print:p-0">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{t.netProfitMargin}</span>
            <span className={`text-lg font-extrabold mt-1 block ${kpis.profitMargin >= 15 ? 'text-emerald-600' : (kpis.profitMargin >= 0 ? 'text-amber-500' : 'text-rose-500')}`}>
              {kpis.profitMargin.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between items-baseline mt-3 border-t border-slate-50 pt-2 print:border-none text-[9px] text-slate-400 font-bold font-sans">
            <span>{language === 'en' ? 'Daily Avg Inflow:' : 'เฉลี่ยรับรายวัน:'}</span>
            <span className="text-slate-700">฿{kpis.dailyAvgIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

      </div>

      {/* --- 3. TREND AREA CHART --- */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm print:border-none print:shadow-none print:p-0">
        <div className="flex items-center space-x-2 mb-6">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 print:hidden">
            <TrendingUp size={16} />
          </div>
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">{t.financialTrends}</h3>
        </div>

        <div className="h-[320px] w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                  tickFormatter={(val) => {
                    const [,,d] = val.split('-');
                    return d; // Show just day number on axis
                  }}
                />
                <YAxis 
                  tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  dx={-8}
                  tickFormatter={(val) => `฿${(val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', fontSize: '12px', fontFamily: 'Inter' }}
                  labelFormatter={(label) => `${language === 'en' ? 'Date' : 'วันที่'}: ${label}`}
                  formatter={(value: any, name: any) => [
                    `฿${parseFloat(value).toLocaleString()}`, 
                    name === 'income' ? (language === 'en' ? 'Income' : 'รายรับ') : (language === 'en' ? 'Expense' : 'รายจ่าย')
                  ]}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} />
                <Area type="monotone" name="income" dataKey="income" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" name="expense" dataKey="expense" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full bg-slate-50 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-wider">
              {language === 'en' ? 'Loading Visualizations...' : 'กำลังจัดเตรียมแผนภูมิรายงาน...'}
            </div>
          )}
        </div>
      </div>

      {/* --- 4. DOUBLE BREAKDOWN CHARTS (Side-by-side or stacked on mobile) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Outflow Breakdown by Category */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm print:border-none print:shadow-none print:p-0">
          <div className="flex items-center space-x-2 mb-6">
            <div className="p-2 bg-rose-50 rounded-lg text-rose-500 print:hidden">
              <TrendingDown size={16} />
            </div>
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">{t.categoryOutflows}</h3>
          </div>

          {breakdowns.expenses.length === 0 ? (
            <div className="text-center py-16 flex flex-col justify-center items-center">
              <Inbox className="w-12 h-12 text-slate-300 mb-2" />
              <span className="text-xs font-bold text-slate-400">{t.noExpenseRecords}</span>
            </div>
          ) : (
            <div className="h-[280px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breakdowns.expenses} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis 
                      dataKey="category" 
                      type="category" 
                      tick={{ fontSize: 9, fill: '#475569', fontWeight: 700 }}
                      width={90}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => t[val as keyof typeof t] || val}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      formatter={(value: any) => [`฿${parseFloat(value).toLocaleString()}`, language === 'en' ? 'Amount' : 'จำนวนเงิน']}
                    />
                    <Bar dataKey="amount" fill="#f43f5e" radius={[0, 8, 8, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full bg-slate-50 animate-pulse rounded-2xl" />
              )}
            </div>
          )}
        </div>

        {/* Inflow Breakdown by Payment Method */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm print:border-none print:shadow-none print:p-0">
          <div className="flex items-center space-x-2 mb-6">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 print:hidden">
              <PieChart size={16} />
            </div>
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">{t.incomePaymentMethods}</h3>
          </div>

          {breakdowns.income.length === 0 ? (
            <div className="text-center py-16 flex flex-col justify-center items-center">
              <Inbox className="w-12 h-12 text-slate-300 mb-2" />
              <span className="text-xs font-bold text-slate-400">{language === 'en' ? 'No Income Records Found' : 'ไม่พบข้อมูลรายรับ'}</span>
            </div>
          ) : (
            <div className="h-[280px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breakdowns.income} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis 
                      dataKey="category" 
                      type="category" 
                      tick={{ fontSize: 9, fill: '#475569', fontWeight: 700 }}
                      width={90}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => language === 'en' ? val : (val === 'Cash' ? 'เงินสด' : (val === 'Credit' ? 'บัตรเครดิต' : (val === 'order' ? 'ขายหน้าร้าน' : val)))}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      formatter={(value: any) => [`฿${parseFloat(value).toLocaleString()}`, language === 'en' ? 'Amount' : 'จำนวนเงิน']}
                    />
                    <Bar dataKey="amount" fill="#0d9488" radius={[0, 8, 8, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full bg-slate-50 animate-pulse rounded-2xl" />
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default AnalyticsView;
