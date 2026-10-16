'use client';

import React, { useState, useMemo } from 'react';
import { 
  TrendingDown,
  DollarSign,
  Wallet,
  AlertCircle,
  X,
  Search,
  Calendar,
  CalendarDays,
  LayoutDashboard,
  Inbox,
  TrendingUp
} from 'lucide-react';
import { Select, Spin, Progress } from 'antd';
import Sidebar, { type NavViewType } from '@/components/layouts/Sidebar';
import Header from '@/components/layouts/Header';
import KPICard from './KPICard';
import AddTransactionModal from '../transactions/AddTransactionModal';
import IncomeExpenseChart from './IncomeExpenseChart';
import CategoryExpenseChart from './CashFlowChart'; // Donut Chart
import TransactionsTable from '../transactions/TransactionsTable';
import CategorySummaryView from './CategorySummaryView'; // Monthly summary view
import BudgetGoalsView from './BudgetGoalsView'; // Planning budgets and goals
import AnalyticsView from './AnalyticsView';
import CalendarCashflowView from './CalendarCashflowView';

// Hooks
import { useMonthlySummary } from '@/hooks/useMonthlySummary';
import { useTransactions, useAddTransaction } from '@/hooks/useTransactions';
import { useTranslation } from '@/hooks/useLanguageStore';
import { useAuthStore } from '@/hooks/useAuthStore';

// --- Colors for Categories ---
const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#064e3b',   // Forest Green
  'food': '#064e3b',            // Forest Green
  'food & dining': '#064e3b',
  'Shopping': '#10b981',        // Emerald Green
  'shopping': '#10b981',
  'Transportation': '#0d9488',  // Teal
  'transportation': '#0d9488',
  'Entertainment': '#84cc16',   // Lime
  'entertainment': '#84cc16',
  'Bills & Utilities': '#65a30d',// Sage Green
  'bills & utilities': '#65a30d',
  'Other Expenses': '#a3e635',   // Soft Yellow-Green
  'other': '#a3e635',
  'ohter': '#a3e635',            // Support database typo
  'other expenses': '#a3e635',
  'drink': '#0284c7',           // Sky Blue
  'sevice': '#8b5cf6',          // Violet (Support database typo)
  'service': '#8b5cf6',
  'all': '#ec4899'              // Pink
};

const FinanceDashboard: React.FC = () => {
  const { language, t } = useTranslation();
  const [currentView, setCurrentView] = useState<NavViewType>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Dynamic Month & Year Filters (Defaults to Current Month - May "05" and Year "2026")
  const currentMonthValue = String(new Date().getMonth() + 1).padStart(2, '0');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthValue);
  const [selectedYear, setSelectedYear] = useState('2026');

  // Drill-down inspector drawer states
  const [selectedInspectorCategory, setSelectedInspectorCategory] = useState<string | null>(null);
  const [inspectorSearchQuery, setInspectorSearchQuery] = useState('');

  // Real-time Database Queries
  const logout = useAuthStore((state) => state.logout);
  const { data: summaryData, isLoading: isSummaryLoading, isError: isSummaryError, error: summaryError } = useMonthlySummary(selectedYear);
  const { data: transactionsList = [], isLoading: isTxLoading, isError: isTxError, error: txError } = useTransactions(selectedMonth, selectedYear);
  const addTransactionMutation = useAddTransaction();

  // Combine loading and error states
  const isLoading = isSummaryLoading || isTxLoading;
  const isError = isSummaryError || isTxError;
  const activeError = summaryError || txError;

  // --- Dynamic Period Date Filtering (Performed at database level!) ---
  const filteredTransactions = transactionsList;

  // --- Process 6-Month Chart Data (Kept at Year scale) ---
  const chartData = useMemo(() => {
    if (!summaryData?.summary) return [];
    return summaryData.summary
      .map(item => {
        const [yr, mn] = item.month.split('-');
        const dateObj = new Date(parseInt(yr), parseInt(mn) - 1, 1);
        const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' });
        return {
          name: monthShort,
          income: item.totalIncome,
          expenses: item.totalExpense
        };
      })
      .reverse()
      .slice(-6);
  }, [summaryData]);

  // --- Group Expenses dynamically based on Filtered Transactions ---
  const expenseCategoryData = useMemo(() => {
    const categoriesMap: Record<string, number> = {};

    filteredTransactions.forEach(t => {
      if (t.amount < 0) {
        const cat = t.category || 'Other Expenses';
        categoriesMap[cat] = (categoriesMap[cat] || 0) + Math.abs(t.amount);
      }
    });

    const totalExpVal = Object.values(categoriesMap).reduce((sum, v) => sum + v, 0);

    // Premium dynamic color palette for custom categories
    const ANALYTICS_COLORS = [
      '#10b981', // Emerald Green
      '#0d9488', // Teal
      '#0284c7', // Sky Blue
      '#6366f1', // Indigo
      '#8b5cf6', // Violet
      '#ec4899', // Pink
      '#f43f5e', // Rose Red
      '#f97316', // Orange
      '#eab308', // Yellow
      '#84cc16'  // Lime
    ];

    return Object.entries(categoriesMap)
      .map(([name, value], index) => {
        const pct = totalExpVal > 0 ? ((value / totalExpVal) * 100).toFixed(0) + '%' : '0%';
        // Dynamically assign standard colors or shift sequentially through the premium color palette
        const color = CATEGORY_COLORS[name] || CATEGORY_COLORS[name.toLowerCase()] || ANALYTICS_COLORS[index % ANALYTICS_COLORS.length];
        return {
          name,
          value,
          percentage: pct,
          color
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);


  // --- Filter Category Transactions for Drawer Inspector ---
  const filteredCategoryTransactions = useMemo(() => {
    if (!selectedInspectorCategory) return [];
    return filteredTransactions.filter(t => 
      t.category === selectedInspectorCategory && 
      t.amount < 0 &&
      t.item.toLowerCase().includes(inspectorSearchQuery.toLowerCase())
    );
  }, [filteredTransactions, selectedInspectorCategory, inspectorSearchQuery]);

  const inspectorCategoryTotal = useMemo(() => {
    return filteredCategoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [filteredCategoryTransactions]);

  // --- Dynamic KPI values based on Selected Period ---
  const totalIncome = useMemo(() => {
    return filteredTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return Math.abs(filteredTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
  }, [filteredTransactions]);

  const totalBalance = useMemo(() => {
    return totalIncome - totalExpense;
  }, [totalIncome, totalExpense]);

  // --- Dynamic Financial Intelligence & Diagnostics Calculations ---
  const savingsRate = useMemo(() => {
    return totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100) : 0;
  }, [totalIncome, totalExpense]);

  const burnRate = useMemo(() => {
    return totalIncome > 0 ? (totalExpense / totalIncome * 100) : 0;
  }, [totalIncome, totalExpense]);

  const expenseTransactions = useMemo(() => {
    return filteredTransactions.filter(t => t.amount < 0);
  }, [filteredTransactions]);

  const incomeTransactions = useMemo(() => {
    return filteredTransactions.filter(t => t.amount > 0);
  }, [filteredTransactions]);

  const avgExpenseSize = useMemo(() => {
    return expenseTransactions.length > 0 ? totalExpense / expenseTransactions.length : 0;
  }, [totalExpense, expenseTransactions]);

  const avgIncomeSize = useMemo(() => {
    return incomeTransactions.length > 0 ? totalIncome / incomeTransactions.length : 0;
  }, [totalIncome, incomeTransactions]);

  const topExpenseCategory = useMemo(() => {
    return expenseCategoryData[0] || null;
  }, [expenseCategoryData]);

  const diagnosticMessage = useMemo(() => {
    if (totalIncome === 0 && totalExpense > 0) {
      return language === 'en'
        ? "Insight: No income records logged yet for this period. Register new cash orders to calculate exact savings and performance diagnostics."
        : "วิเคราะห์: ยังไม่มีการบันทึกรายรับในรอบเวลานี้ กรุณาเพิ่มรายการขาย/ออร์เดอร์ใหม่ เพื่อเริ่มต้นคำนวณอัตราการเก็บออมและสุขภาพของกิจการ";
    }
    if (totalIncome === 0 && totalExpense === 0) {
      return language === 'en'
        ? "Insight: No transactions recorded in this period. Use '+ New Transaction' to log financial activities."
        : "วิเคราะห์: ยังไม่พบการทำธุรกรรมในรอบเวลานี้ คลิกที่ปุ่ม '+ เพิ่มรายการใหม่' ด้านบนเพื่อลงบันทึกรายรับ/รายจ่าย";
    }
    if (savingsRate < 0) {
      return language === 'en'
        ? `Alert: Outflows exceed inflows this month by ฿${Math.abs(totalBalance).toLocaleString(undefined, {minimumFractionDigits: 2})}! Cutting discretionary expenses in high-burn categories (like ${topExpenseCategory ? topExpenseCategory.name : 'Shopping'}) is highly recommended to protect cash flow.`
        : `แจ้งเตือน: ยอดค่าใช้จ่ายของคุณแซงหน้ารายรับไปเป็นจำนวน ฿${Math.abs(totalBalance).toLocaleString(undefined, {minimumFractionDigits: 2})}! แนะนำให้ทยอยตัดทอนค่าใช้จ่ายในหมวดที่จ่ายสูงสุด (เช่น ${topExpenseCategory ? (t[topExpenseCategory.name as keyof typeof t] || topExpenseCategory.name) : 'ช้อปปิ้ง'}) เพื่อรักษาเสถียรภาพกระแสเงินสด`;
    }
    if (savingsRate >= 0 && savingsRate <= 20) {
      return language === 'en'
        ? `Insight: Your savings rate is at a moderate ${savingsRate.toFixed(1)}%. Financial advisors recommend saving at least 20% of your POS revenues to build a resilient emergency business buffer.`
        : `วิเคราะห์: อัตราการออมเงินสะสมในธุรกิจของคุณอยู่ในระดับปานกลางที่ ${savingsRate.toFixed(1)}% ผู้เชี่ยวชาญแนะนำให้เพิ่มสัดส่วนการออมสะสมให้ได้อย่างน้อย 20% เพื่อสร้างกองทุนเงินสำรองฉุกเฉินสำหรับกิจการ`;
    }
    return language === 'en'
      ? `Congratulations! You have an exceptionally healthy savings rate of ${savingsRate.toFixed(1)}% this month. Your expenses are exceptionally well-controlled, maintaining excellent business net margins.`
      : `ขอแสดงความยินดี! คุณมีอัตราการออมสุทธิสูงถึง ${savingsRate.toFixed(1)}% ในเดือนนี้ ถือว่าสุขภาพทางการเงินแข็งแกร่งมาก กิจการของคุณมีการควบคุมรายจ่ายอย่างมีประสิทธิภาพและทำกำไรสะสมได้ดีเยี่ยม`;
  }, [totalIncome, totalExpense, savingsRate, totalBalance, topExpenseCategory, language, t]);

  // --- Add Transaction submit handler ---
  const handleAddTransaction = async (newTx: {
    item: string;
    type: 'income' | 'expense';
    category: string;
    amount: number;
    date: string;
  }) => {
    try {
      await addTransactionMutation.mutateAsync(newTx);
    } catch (err) {
      console.error("Mutation failed: ", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4 bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
          <Spin size="large" description="Loading Live Database Dashboard..." />
        </div>
      </div>
    );
  }

  if (isError) {
    const isAuthError =
      (activeError as any)?.status === 401 ||
      (activeError as Error)?.message?.includes('Unauthorized') ||
      (activeError as Error)?.message?.includes('Session expired');

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-rose-100 text-center max-w-md animate-fadeIn">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {isAuthError
              ? (language === 'en' ? 'Session Expired' : 'เซสชันหมดอายุ')
              : (language === 'en' ? 'Error Connecting to database' : 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล')}
          </h2>
          <p className="text-gray-500 mb-6 leading-relaxed text-sm">
            {isAuthError
              ? (language === 'en'
                  ? 'Your login session has expired after an extended period. Please log in again to continue.'
                  : 'คุณไม่ได้เข้าใช้งานเป็นเวลานาน เซสชันเดิมจึงหมดอายุ กรุณาเข้าสู่ระบบใหม่อีกครั้ง')
              : ((activeError as Error)?.message || 'Unable to retrieve records from the Supabase server.')}
          </p>
          <div className="flex flex-col gap-3">
            {isAuthError ? (
              <button 
                onClick={() => logout()}
                className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg w-full cursor-pointer"
              >
                {language === 'en' ? 'Log In Again' : 'เข้าสู่ระบบใหม่'}
              </button>
            ) : (
              <>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg w-full cursor-pointer"
                >
                  {language === 'en' ? 'Retry Connection' : 'ลองใหม่อีกครั้ง'}
                </button>
                <button 
                  onClick={() => logout()}
                  className="border border-slate-200 text-slate-600 px-8 py-2.5 rounded-xl font-semibold hover:bg-slate-50 transition-all w-full cursor-pointer text-sm"
                >
                  {language === 'en' ? 'Log Out & Re-login' : 'ออกจากระบบเพื่อเข้าสู่ระบบใหม่'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-3 sm:px-6 py-3.5 pb-28 md:pl-32 md:pr-8 md:py-8 font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Dynamic Sidebar / Mobile Bottom Dock */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        onAddTransaction={() => setIsModalOpen(true)}
      />
      
      <main className="p-0 max-w-[1600px] mx-auto">
        <Header 
          onAddTransaction={() => setIsModalOpen(true)} 
          title={
            currentView === 'dashboard' 
              ? t.dashboard 
              : currentView === 'calendar'
                ? (language === 'en' ? 'Daily Cashflow Calendar' : 'ปฏิทินกระแสเงินสดรายวัน')
                : currentView === 'summary' 
                  ? t.expenseSummary 
                  : currentView === 'planning'
                    ? (language === 'en' ? 'Budgets & Goals' : 'แผนงบประมาณและเงินออม')
                    : (language === 'en' ? 'Financial Analytics' : 'วิเคราะห์การเงิน')
          }
          subTitle={
            currentView === 'dashboard' 
              ? t.welcomeTitle 
              : currentView === 'calendar'
                ? (language === 'en' ? 'Inspect daily inflows, outflows, and transactions by date' : 'ตรวจสอบยอดรายรับ-รายจ่าย และรายการธุรกรรมแยกรายวัน')
                : currentView === 'summary' 
                  ? t.welcomeSubtitle 
                  : currentView === 'planning'
                    ? (language === 'en' ? 'Track target saving goals and set limits' : 'จำกัดรายจ่ายและบันทึกสะสมเงินออมเพื่อการลงทุน')
                    : (language === 'en' ? 'Analyze financial cash flows and track business margins' : 'วิเคราะห์ภาพรวมกระแสเงินสดและสัดส่วนของกิจการ')
          }
        />

        {/* --- DYNAMIC REPORT PERIOD FILTER BAR --- */}
        {(currentView === 'dashboard' || currentView === 'calendar' || currentView === 'summary' || currentView === 'planning') && (
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-4 md:mb-8 bg-white/90 backdrop-blur-md p-2.5 sm:p-4 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-[230px]">
              <div className="flex items-center gap-1.5 pl-1 shrink-0 text-slate-400">
                <Calendar size={15} className="text-emerald-600 shrink-0" />
                <span className="hidden xs:inline text-[11px] sm:text-xs font-black uppercase tracking-wider">{t.reportPeriod}:</span>
              </div>
            
              {/* Month Selector */}
              <Select 
                value={selectedMonth}
                onChange={(val) => setSelectedMonth(val)}
                className="font-bold text-xs hover:border-emerald-200 min-w-[105px] sm:min-w-[140px] flex-1 sm:flex-initial"
                style={{ height: '38px' }}
                options={[
                  { value: 'ALL', label: t.allMonths },
                  { value: '01', label: t.january },
                  { value: '02', label: t.february },
                  { value: '03', label: t.march },
                  { value: '04', label: t.april },
                  { value: '05', label: t.may },
                  { value: '06', label: t.june },
                  { value: '07', label: t.july },
                  { value: '08', label: t.august },
                  { value: '09', label: t.september },
                  { value: '10', label: t.october },
                  { value: '11', label: t.november },
                  { value: '12', label: t.december }
                ]}
              />

              {/* Year Selector */}
              <Select 
                value={selectedYear}
                onChange={(val) => setSelectedYear(val)}
                className="font-bold text-xs hover:border-emerald-200 w-[88px] sm:min-w-[95px] shrink-0"
                style={{ height: '38px' }}
                options={[
                  { value: '2026', label: '2026' },
                  { value: '2025', label: '2025' },
                  { value: '2024', label: '2024' }
                ]}
              />
            </div>

            {/* Quick View Switcher (Overview vs Daily Calendar) */}
            {(currentView === 'dashboard' || currentView === 'calendar') && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setCurrentView('dashboard')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
                    currentView === 'dashboard'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <LayoutDashboard size={14} />
                  <span>{language === 'en' ? 'Overview' : 'ภาพรวม'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView('calendar')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
                    currentView === 'calendar'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <CalendarDays size={14} />
                  <span>{language === 'en' ? 'Daily Calendar' : 'ปฏิทินรายวัน'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {currentView === 'dashboard' ? (
          /* MAIN DASHBOARD OVERVIEW */
          <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-fadeIn">
            {/* KPI Section: Hero Balance full-width on mobile, Income & Expenses side-by-side on mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 md:gap-6">
              <KPICard 
                title={t.totalBalance} 
                amount={totalBalance} 
                trend={summaryData?.kpis.balanceTrend || 0} 
                isPositive={(summaryData?.kpis.balanceTrend || 0) >= 0} 
                icon={Wallet} 
                color="bg-emerald-600" 
                isDarkTheme={true}
                className="col-span-2 lg:col-span-1"
              />
              <KPICard 
                title={t.monthlyIncome} 
                amount={totalIncome} 
                trend={summaryData?.kpis.incomeTrend || 0} 
                isPositive={(summaryData?.kpis.incomeTrend || 0) >= 0} 
                icon={DollarSign} 
                color="bg-emerald-500" 
                amountClassName="text-emerald-600 font-bold"
              />
              <KPICard 
                title={t.monthlyExpenses} 
                amount={totalExpense} 
                trend={Math.abs(summaryData?.kpis.expenseTrend || 0)} 
                isPositive={(summaryData?.kpis.expenseTrend || 0) < 0} 
                icon={TrendingDown} 
                color="bg-rose-500" 
                amountClassName="text-rose-500 font-medium"
              />
            </div>

            {/* --- FINANCIAL INTELLIGENCE & ANALYTICS DIAGNOSTIC CARD --- */}
            <div className="bg-gradient-to-br from-white via-white to-slate-50/70 p-3.5 sm:p-6 rounded-2xl md:rounded-3xl shadow-sm border border-slate-100/90 hover:shadow-md hover:border-emerald-200/50 transition-all duration-300 relative overflow-hidden group">
              {/* Glowing decorative background bubble */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/20 rounded-full blur-2xl group-hover:bg-emerald-200/30 transition-all duration-500 pointer-events-none"></div>

              <div className="flex items-center gap-2.5 mb-3 sm:mb-5 relative z-10">
                <div className="p-2 sm:p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shadow-sm group-hover:scale-105 group-hover:rotate-3 transition-transform shrink-0">
                  <TrendingUp size={18} className="sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider truncate">
                    {language === 'en' ? 'POS Financial Intelligence & Diagnostics' : 'วิเคราะห์สุขภาพทางการเงิน (POS Analytics)'}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 truncate">
                    {language === 'en' ? 'Dynamic performance analysis based on active transactions' : 'ประเมินผลอัตโนมัติตามรายการธุรกรรมจริงของคุณ'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-6 pt-1 sm:pt-2">
                {/* Metric 1: Savings Rate */}
                <div className="space-y-1.5 p-2.5 sm:p-0 bg-slate-50/70 md:bg-transparent rounded-xl md:rounded-none">
                  <div className="flex justify-between items-baseline gap-1">
                    <span className="text-[10px] sm:text-xs text-slate-500 font-extrabold uppercase truncate">
                      {language === 'en' ? 'Savings Rate' : 'อัตราออม'}
                    </span>
                    <span className={`text-sm sm:text-lg font-black shrink-0 ${savingsRate >= 20 ? 'text-emerald-600' : (savingsRate >= 0 ? 'text-amber-500' : 'text-rose-500')}`}>
                      {savingsRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    percent={Math.max(0, parseFloat(savingsRate.toFixed(1)))} 
                    strokeColor={savingsRate >= 20 ? '#10b981' : (savingsRate >= 0 ? '#f59e0b' : '#f43f5e')} 
                    railColor="#f1f5f9"
                    showInfo={false}
                    size={['100%', 8]}
                  />
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold truncate">
                    {language === 'en' ? 'Target: 20.0%+' : 'เป้าหมาย: 20.0%+'}
                  </p>
                </div>

                {/* Metric 3 on Mobile side-by-side with Metric 1: Top Spend & Burn Ratio */}
                <div className="space-y-1.5 p-2.5 sm:p-0 bg-slate-50/70 md:bg-transparent rounded-xl md:rounded-none md:order-3">
                  <div className="flex justify-between items-baseline gap-1">
                    <span className="text-[10px] sm:text-xs text-slate-500 font-extrabold uppercase truncate">
                      {language === 'en' ? 'Burn Ratio' : 'สัดส่วนจ่าย'}
                    </span>
                    <span className={`text-sm sm:text-base font-black shrink-0 ${burnRate > 100 ? 'text-rose-500' : 'text-slate-800'}`}>
                      {burnRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    percent={Math.min(100, parseFloat(burnRate.toFixed(1)))} 
                    strokeColor={burnRate > 80 ? '#f43f5e' : '#0d9488'} 
                    railColor="#f1f5f9"
                    showInfo={false}
                    size={['100%', 8]}
                  />
                  {topExpenseCategory ? (
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold truncate">
                      {language === 'en' ? 'Top: ' : 'สูงสุด: '} 
                      <strong className="text-rose-500 font-black">
                        {t[topExpenseCategory.name as keyof typeof t] || topExpenseCategory.name}
                      </strong>
                    </p>
                  ) : (
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold truncate">
                      {language === 'en' ? 'No expenses yet' : 'ยังไม่มีรายจ่าย'}
                    </p>
                  )}
                </div>

                {/* Metric 2: Average Sale & Expense Value */}
                <div className="col-span-2 md:col-span-1 md:order-2 grid grid-cols-2 gap-3 sm:gap-4 p-2.5 sm:p-0 bg-slate-50/70 md:bg-transparent rounded-xl md:rounded-none md:border-l md:border-r border-slate-100 md:px-5">
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block truncate">
                      {language === 'en' ? 'Avg. Sale Revenue' : 'เฉลี่ยรายรับ / ครั้ง'}
                    </span>
                    <span className="text-xs sm:text-sm font-black text-emerald-600 mt-0.5 block">
                      ฿{avgIncomeSize.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">
                      {incomeTransactions.length} {language === 'en' ? 'sales' : 'รายการขาย'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase block truncate">
                      {language === 'en' ? 'Avg. Expense Cost' : 'เฉลี่ยรายจ่าย / ครั้ง'}
                    </span>
                    <span className="text-xs sm:text-sm font-black text-rose-500 mt-0.5 block">
                      ฿{avgExpenseSize.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">
                      {expenseTransactions.length} {language === 'en' ? 'spends' : 'รายการจ่าย'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Health Diagnostic Insight Box */}
              <div className="mt-3 sm:mt-5 p-2.5 sm:p-3.5 bg-gradient-to-r from-emerald-50/80 to-emerald-100/30 border border-emerald-100/60 rounded-xl flex items-start gap-2 animate-fadeIn relative z-10">
                <span className="text-sm shrink-0 mt-0.5">💡</span>
                <p className="text-[11px] sm:text-xs leading-relaxed text-emerald-950 font-bold font-sans">
                  {diagnosticMessage}
                </p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <IncomeExpenseChart 
                data={chartData} 
                selectedYear={selectedYear} 
                onYearChange={setSelectedYear} 
              />
              <CategoryExpenseChart 
                data={expenseCategoryData} 
                totalExpenses={totalExpense} 
                onSelectCategory={(cat) => {
                  setSelectedInspectorCategory(cat);
                  setInspectorSearchQuery('');
                }}
              />
            </div>

            {/* Recent Transactions List */}
            <TransactionsTable transactions={filteredTransactions} />
          </div>
        ) : currentView === 'calendar' ? (
          /* DAILY CASHFLOW CALENDAR VIEW */
          <CalendarCashflowView
            transactions={transactionsList || []}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            onAddTransaction={() => setIsModalOpen(true)}
          />
        ) : currentView === 'summary' ? (
          /* MONTHLY EXPENSE SUMMARY GRID */
          <CategorySummaryView 
            transactions={filteredTransactions} 
            onSelectCategory={(cat) => {
              setSelectedInspectorCategory(cat);
              setInspectorSearchQuery('');
            }}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        ) : currentView === 'planning' ? (
          /* PLANNING BUDGETS & GOALS VIEW */
          <BudgetGoalsView 
            transactions={filteredTransactions} 
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        ) : (
          /* FINANCIAL ANALYTICS & REPORTS VIEW */
          <AnalyticsView />
        )}
      </main>

      {/* --- DRILL-DOWN CATEGORY EXPENSE DRAWER / MOBILE BOTTOM SHEET --- */}
      {selectedInspectorCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-end md:items-stretch md:justify-end animate-fadeIn">
          {/* Backdrop Closer */}
          <div className="fixed inset-0" onClick={() => setSelectedInspectorCategory(null)}></div>
          
          {/* Sliding Sheet / Drawer Panel */}
          <div className="relative w-full md:max-w-lg bg-white shadow-2xl max-h-[88vh] md:max-h-full h-auto md:h-full flex flex-col z-[120] rounded-t-3xl md:rounded-none border-t md:border-t-0 md:border-l border-emerald-100/60 animate-slideUp md:animate-slideLeft">
            
            {/* Mobile Pull Handle Indicator */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-1 md:hidden"></div>

            {/* Drawer Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-100">
                  {t.categoryDetails}
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  {t[selectedInspectorCategory as keyof typeof t] || selectedInspectorCategory}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedInspectorCategory(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Spending Highlight Badge */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-50 to-emerald-100/40 border-b border-emerald-100/50 flex justify-between items-center">
              <span className="text-xs sm:text-sm font-bold text-slate-600">{t.totalOutflowInCategory}</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-950 font-sans">
                ฿{inspectorCategoryTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Interactive Search inside Category */}
            <div className="p-3 sm:p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder={
                    language === 'en' 
                      ? `Search in ${selectedInspectorCategory}...` 
                      : `ค้นหาใน ${t[selectedInspectorCategory as keyof typeof t] || selectedInspectorCategory}...`
                  }
                  value={inspectorSearchQuery}
                  onChange={(e) => setInspectorSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none font-medium"
                />
              </div>
            </div>

            {/* Transactions Drill-down List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 sm:space-y-4">
              {filteredCategoryTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">{t.noTransactionsFoundSearch}</p>
                </div>
              ) : (
                filteredCategoryTransactions.map((tx) => (
                  <div 
                    key={tx.id} 
                    className="flex justify-between items-center p-3.5 sm:p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200 hover:shadow-sm transition-all group"
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <p className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-emerald-700 transition-colors truncate">
                        {tx.item}
                      </p>
                      <div className="flex items-center space-x-1.5 text-[10px] sm:text-[11px] text-slate-400 font-semibold">
                        <Calendar size={12} />
                        <span>{tx.date}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-black text-rose-500">
                        -฿{Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer closer */}
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end pb-safe">
              <button 
                onClick={() => setSelectedInspectorCategory(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
              >
                {t.closeInspector}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Transaction Modal */}
      <AddTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={handleAddTransaction}
      />
    </div>
  );
};

export default FinanceDashboard;
export type { FinanceDashboard };
