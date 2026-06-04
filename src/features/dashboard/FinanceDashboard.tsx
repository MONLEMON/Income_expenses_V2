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
  Inbox,
  TrendingUp
} from 'lucide-react';
import { Select, Spin, Progress } from 'antd';
import Sidebar from '@/components/layouts/Sidebar';
import Header from '@/components/layouts/Header';
import KPICard from './KPICard';
import AddTransactionModal from '../transactions/AddTransactionModal';
import IncomeExpenseChart from './IncomeExpenseChart';
import CategoryExpenseChart from './CashFlowChart'; // Donut Chart
import TransactionsTable from '../transactions/TransactionsTable';
import CategorySummaryView from './CategorySummaryView'; // Monthly summary view
import BudgetGoalsView from './BudgetGoalsView'; // Planning budgets and goals
import AnalyticsView from './AnalyticsView';

// Hooks
import { useMonthlySummary } from '@/hooks/useMonthlySummary';
import { useTransactions, useAddTransaction } from '@/hooks/useTransactions';
import { useTranslation } from '@/hooks/useLanguageStore';

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
  const [currentView, setCurrentView] = useState<'dashboard' | 'summary' | 'planning' | 'analytics'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Dynamic Month & Year Filters (Defaults to Current Month - May "05" and Year "2026")
  const currentMonthValue = String(new Date().getMonth() + 1).padStart(2, '0');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthValue);
  const [selectedYear, setSelectedYear] = useState('2026');

  // Drill-down inspector drawer states
  const [selectedInspectorCategory, setSelectedInspectorCategory] = useState<string | null>(null);
  const [inspectorSearchQuery, setInspectorSearchQuery] = useState('');

  // Real-time Database Queries
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
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-rose-100 text-center max-w-md">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Connecting to database</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            {(activeError as Error)?.message || 'Unable to retrieve records from the Supabase server.'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-800 transition-all shadow-md hover:shadow-lg w-full cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 pb-24 md:pl-32 md:pr-8 md:py-8 font-sans text-gray-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Dynamic Sidebar */}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="p-0 md:p-4 max-w-[1600px] mx-auto">
        <Header 
          onAddTransaction={() => setIsModalOpen(true)} 
          title={
            currentView === 'dashboard' 
              ? t.dashboard 
              : currentView === 'summary' 
                ? t.expenseSummary 
                : currentView === 'planning'
                  ? (language === 'en' ? 'Budgets & Goals' : 'แผนงบประมาณและเงินออม')
                  : (language === 'en' ? 'Financial Analytics' : 'วิเคราะห์การเงิน')
          }
          subTitle={
            currentView === 'dashboard' 
              ? t.welcomeTitle 
              : currentView === 'summary' 
                ? t.welcomeSubtitle 
                : currentView === 'planning'
                  ? (language === 'en' ? 'Track target saving goals and set limits' : 'จำกัดรายจ่ายและบันทึกสะสมเงินออมเพื่อการลงทุน')
                  : (language === 'en' ? 'Analyze financial cash flows and track business margins' : 'วิเคราะห์ภาพรวมกระแสเงินสดและสัดส่วนของกิจการ')
          }
        />

        {/* --- DYNAMIC REPORT PERIOD FILTER BAR --- */}
        {(currentView === 'dashboard' || currentView === 'summary' || currentView === 'planning') && (
          <div className="flex flex-wrap items-center gap-3 mb-8 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm animate-fadeIn">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">{t.reportPeriod}</span>
          
          {/* Month Selector */}
          <Select 
            value={selectedMonth}
            onChange={(val) => setSelectedMonth(val)}
            className="font-bold text-xs hover:border-emerald-200 min-w-[130px]"
            style={{ height: '36px' }}
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
            className="font-bold text-xs hover:border-emerald-200 min-w-[80px]"
            style={{ height: '36px' }}
            options={[
              { value: '2026', label: '2026' },
              { value: '2025', label: '2025' },
              { value: '2024', label: '2024' }
            ]}
          />
        </div>
        )}

        {currentView === 'dashboard' ? (
          /* MAIN DASHBOARD OVERVIEW */
          <div className="space-y-6 md:space-y-8 animate-fadeIn">
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <KPICard 
                title={t.totalBalance} 
                amount={totalBalance} 
                trend={summaryData?.kpis.balanceTrend || 0} 
                isPositive={(summaryData?.kpis.balanceTrend || 0) >= 0} 
                icon={Wallet} 
                color="bg-emerald-600" 
                isDarkTheme={true}
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

            {/* --- NEW FINANCIAL INTELLIGENCE & ANALYTICS DIAGNOSTIC CARD --- */}
            <div className="bg-gradient-to-br from-white to-slate-50/50 p-6 rounded-2xl shadow-sm border border-slate-100/80 hover:shadow-md hover:border-emerald-200/50 transition-all duration-300 relative overflow-hidden group">
              {/* Glowing decorative background bubble */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/20 rounded-full blur-2xl group-hover:bg-emerald-200/30 transition-all duration-500 pointer-events-none"></div>

              <div className="flex items-center gap-2.5 mb-5 relative z-10">
                <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shadow-sm group-hover:scale-105 group-hover:rotate-3 transition-transform">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                    {language === 'en' ? 'POS Financial Intelligence & Diagnostics' : 'แผงวิเคราะห์และประเมินผลอัจฉริยะด้านการเงิน (POS Analytics)'}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {language === 'en' ? 'Dynamic performance analysis based on active transactions' : 'การวิเคราะห์ภาพรวมทางการเงินอ้างอิงตามธุรกรรมจริงของคุณ'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3">
                {/* Metric 1: Savings Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-500 font-bold uppercase">
                      {language === 'en' ? 'Savings Rate' : 'อัตราการเก็บออม'}
                    </span>
                    <span className={`text-lg font-extrabold ${savingsRate >= 20 ? 'text-emerald-600' : (savingsRate >= 0 ? 'text-amber-500' : 'text-rose-500')}`}>
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
                  <p className="text-[10px] text-slate-400 font-semibold">
                    {language === 'en' ? 'Target savings: 20.0%+' : 'เป้าหมายการออม: 20.0% ขึ้นไป'}
                  </p>
                </div>

                {/* Metric 2: Average Sale & Expense Value */}
                <div className="grid grid-cols-2 gap-4 border-t border-b md:border-t-0 md:border-b-0 md:border-l md:border-r border-slate-100 py-4 md:py-0 md:px-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      {language === 'en' ? 'Avg. Sale Revenue' : 'เฉลี่ยรายรับ / ครั้ง'}
                    </span>
                    <span className="text-sm font-extrabold text-emerald-600 mt-1 block">
                      ฿{avgIncomeSize.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold">
                      {incomeTransactions.length} {language === 'en' ? 'sales' : 'รายการขาย'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      {language === 'en' ? 'Avg. Expense Cost' : 'เฉลี่ยรายจ่าย / ครั้ง'}
                    </span>
                    <span className="text-sm font-extrabold text-rose-500 mt-1 block">
                      ฿{avgExpenseSize.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold">
                      {expenseTransactions.length} {language === 'en' ? 'spends' : 'รายการจ่าย'}
                    </span>
                  </div>
                </div>

                {/* Metric 3: Top Spend & Burn Ratio */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-500 font-bold uppercase">
                      {language === 'en' ? 'Burn-to-Income Ratio' : 'อัตราส่วนการใช้จ่าย'}
                    </span>
                    <span className={`text-base font-extrabold ${burnRate > 100 ? 'text-rose-500' : 'text-slate-700'}`}>
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
                  {topExpenseCategory && (
                    <p className="text-[10px] text-slate-400 font-semibold truncate">
                      {language === 'en' ? 'Top Category: ' : 'หมวดจ่ายสูงสุด: '} 
                      <strong className="text-rose-500 font-bold">
                        {t[topExpenseCategory.name as keyof typeof t] || topExpenseCategory.name}
                      </strong>
                    </p>
                  )}
                </div>
              </div>

              {/* Dynamic Health Diagnostic Insight Box */}
              <div className="mt-5 p-3.5 bg-gradient-to-r from-emerald-50/60 to-emerald-100/20 border border-emerald-100/50 rounded-xl flex items-start gap-2.5 animate-fadeIn relative z-10">
                <span className="text-sm">💡</span>
                <p className="text-[11px] leading-relaxed text-emerald-900 font-bold font-sans">
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
              />
            </div>

            {/* Recent Transactions List */}
            <TransactionsTable transactions={filteredTransactions} />
          </div>
        ) : currentView === 'summary' ? (
          /* NEW MONTHLY EXPENSE SUMMARY GRID */
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
          /* NEW PLANNING BUDGETS & GOALS VIEW */
          <BudgetGoalsView 
            transactions={filteredTransactions}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        ) : (
          /* NEW FINANCIAL ANALYTICS & REPORTS VIEW */
          <AnalyticsView />
        )}
      </main>

      {/* --- DRILL-DOWN CATEGORY EXPENSE DRAWER --- */}
      {selectedInspectorCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-end animate-fadeIn">
          {/* Backdrop Closer */}
          <div className="flex-1" onClick={() => setSelectedInspectorCategory(null)}></div>
          
          {/* Sliding Sheet Panel */}
          <div className="w-full max-w-lg bg-white/95 backdrop-blur-md shadow-2xl h-full flex flex-col z-[120] border-l border-emerald-100/50 animate-slideLeft">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  {t.categoryDetails}
                </span>
                <h2 className="text-xl font-extrabold text-gray-900 mt-1">
                  {t[selectedInspectorCategory as keyof typeof t] || selectedInspectorCategory}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedInspectorCategory(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Spending Highlight Badge */}
            <div className="p-6 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-gray-100 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-600">{t.totalOutflowInCategory}</span>
              <span className="text-2xl font-extrabold text-emerald-900">
                ฿{inspectorCategoryTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Interactive Search inside Category */}
            <div className="p-4 border-b border-gray-50 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder={
                    language === 'en' 
                      ? `Search in ${selectedInspectorCategory}...` 
                      : `ค้นหาใน ${t[selectedInspectorCategory as keyof typeof t] || selectedInspectorCategory}...`
                  }
                  value={inspectorSearchQuery}
                  onChange={(e) => setInspectorSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                />
              </div>
            </div>

            {/* Transactions Drill-down List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {filteredCategoryTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 font-medium">{t.noTransactionsFoundSearch}</p>
                </div>
              ) : (
                filteredCategoryTransactions.map((tx) => (
                  <div 
                    key={tx.id} 
                    className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-2xl hover:border-emerald-200 hover:shadow-sm transition-all group"
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-gray-800 text-sm group-hover:text-emerald-700 transition-colors">
                        {tx.item}
                      </p>
                      <div className="flex items-center space-x-2 text-[11px] text-gray-400 font-semibold">
                        <Calendar size={12} />
                        <span>{tx.date}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-rose-500">
                        -฿{Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer closer */}
            <div className="p-6 border-t border-gray-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setSelectedInspectorCategory(null)}
                className="px-5 py-2 rounded-xl font-bold text-sm text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-sm cursor-pointer"
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
