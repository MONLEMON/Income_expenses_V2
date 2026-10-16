'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Plus,
  Inbox,
  Edit3,
  Trash2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Modal, App } from 'antd';
import { useTranslation } from '@/hooks/useLanguageStore';
import type { Transaction } from '@/hooks/useTransactions';
import { useUpdateTransaction, useDeleteTransaction } from '@/hooks/useTransactions';
import EditTransactionModal from '../transactions/EditTransactionModal';

interface CalendarCashflowViewProps {
  transactions: Transaction[];
  selectedMonth: string;
  selectedYear: string;
  onMonthChange?: (month: string) => void;
  onYearChange?: (year: string) => void;
  onAddTransaction?: (defaultDate?: string) => void;
}

const formatCompactAmount = (val: number): string => {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(val >= 10000 ? 0 : 1)}k`;
  return val.toFixed(0);
};

const CalendarCashflowView: React.FC<CalendarCashflowViewProps> = ({
  transactions,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  onAddTransaction,
}) => {
  const { language, t } = useTranslation();
  const { message } = App.useApp();
  const updateTxMutation = useUpdateTransaction();
  const deleteTxMutation = useDeleteTransaction();

  // Determine active month (1-12) for calendar grid even if global filter is 'ALL'
  const currentRealMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  const [fallbackMonth, setFallbackMonth] = useState<string>(currentRealMonth);
  const activeMonthStr = selectedMonth === 'ALL' ? fallbackMonth : selectedMonth;
  const activeMonthNum = parseInt(activeMonthStr, 10);
  const activeYearNum = parseInt(selectedYear, 10);

  // Selected date in DD/MM/YYYY format
  const [selectedDay, setSelectedDay] = useState<number>(() => new Date().getDate());
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Group transactions by day number within activeMonth & activeYear
  const dailyMap = useMemo(() => {
    const map: Record<
      number,
      {
        income: number;
        expense: number;
        net: number;
        items: Transaction[];
      }
    > = {};

    transactions.forEach((tx) => {
      const [dStr, mStr, yStr] = tx.date.split('/');
      const d = parseInt(dStr, 10);
      const m = parseInt(mStr, 10);
      const y = parseInt(yStr, 10);

      if (m === activeMonthNum && y === activeYearNum && !isNaN(d)) {
        if (!map[d]) {
          map[d] = { income: 0, expense: 0, net: 0, items: [] };
        }
        if (tx.amount > 0) {
          map[d].income += tx.amount;
        } else {
          map[d].expense += Math.abs(tx.amount);
        }
        map[d].net = map[d].income - map[d].expense;
        map[d].items.push(tx);
      }
    });

    return map;
  }, [transactions, activeMonthNum, activeYearNum]);

  // Auto-select latest active day (or today) only when switching month or year
  useEffect(() => {
    const daysInMonth = new Date(activeYearNum, activeMonthNum, 0).getDate();
    const activeDays = Object.keys(dailyMap)
      .map(Number)
      .sort((a, b) => b - a);

    if (activeDays.length > 0) {
      setSelectedDay(activeDays[0]);
    } else if (selectedDay > daysInMonth) {
      setSelectedDay(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMonthNum, activeYearNum]);

  // Calendar Grid computation
  const { daysInMonth, firstDayOfWeek } = useMemo(() => {
    const totalDays = new Date(activeYearNum, activeMonthNum, 0).getDate();
    const startWeekday = new Date(activeYearNum, activeMonthNum - 1, 1).getDay(); // 0 (Sun) - 6 (Sat)
    return { daysInMonth: totalDays, firstDayOfWeek: startWeekday };
  }, [activeMonthNum, activeYearNum]);

  // Monthly Calendar Stats
  const calendarStats = useMemo(() => {
    const entries = Object.entries(dailyMap);
    let totalMonthInc = 0;
    let totalMonthExp = 0;
    let bestIncomeDay: { day: number; amount: number } | null = null;
    let highestExpenseDay: { day: number; amount: number } | null = null;

    entries.forEach(([dayStr, data]) => {
      const day = Number(dayStr);
      totalMonthInc += data.income;
      totalMonthExp += data.expense;
      if (data.income > 0 && (!bestIncomeDay || data.income > bestIncomeDay.amount)) {
        bestIncomeDay = { day, amount: data.income };
      }
      if (data.expense > 0 && (!highestExpenseDay || data.expense > highestExpenseDay.amount)) {
        highestExpenseDay = { day, amount: data.expense };
      }
    });

    return {
      activeDaysCount: entries.length,
      totalMonthInc,
      totalMonthExp,
      bestIncomeDay: bestIncomeDay as { day: number; amount: number } | null,
      highestExpenseDay: highestExpenseDay as { day: number; amount: number } | null,
    };
  }, [dailyMap]);

  // Navigate Previous / Next Month
  const handleStepMonth = (delta: number) => {
    let nextM = activeMonthNum + delta;
    let nextY = activeYearNum;
    if (nextM < 1) {
      nextM = 12;
      nextY -= 1;
    } else if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    const nextMStr = String(nextM).padStart(2, '0');
    const nextYStr = String(nextY);

    if (selectedMonth === 'ALL') {
      setFallbackMonth(nextMStr);
    } else {
      onMonthChange?.(nextMStr);
    }
    if (nextYStr !== selectedYear) {
      onYearChange?.(nextYStr);
    }
  };

  const handleDeleteTx = (record: Transaction) => {
    Modal.confirm({
      title: language === 'en' ? 'Confirm Deletion' : 'ยืนยันการลบรายการ',
      icon: <AlertTriangle className="text-rose-500 mr-2 shrink-0" size={22} />,
      content:
        language === 'en'
          ? `Are you sure you want to delete "${record.item}"?`
          : `คุณแน่ใจหรือไม่ที่จะลบรายการ "${record.item}"?`,
      okText: language === 'en' ? 'Delete' : 'ลบออก',
      okType: 'danger',
      cancelText: language === 'en' ? 'Cancel' : 'ยกเลิก',
      onOk: async () => {
        try {
          await deleteTxMutation.mutateAsync(record.id);
          message.success(language === 'en' ? 'Transaction deleted!' : 'ลบรายการเรียบร้อยแล้ว!');
        } catch (err: any) {
          message.error(err.message || 'Failed to delete transaction');
        }
      },
    });
  };

  const monthTitle = useMemo(() => {
    const d = new Date(activeYearNum, activeMonthNum - 1, 1);
    return d.toLocaleDateString(language === 'en' ? 'en-US' : 'th-TH', {
      month: 'long',
      year: 'numeric',
    });
  }, [activeMonthNum, activeYearNum, language]);

  const selectedDateLabel = useMemo(() => {
    const d = new Date(activeYearNum, activeMonthNum - 1, selectedDay);
    return d.toLocaleDateString(language === 'en' ? 'en-US' : 'th-TH', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [activeYearNum, activeMonthNum, selectedDay, language]);

  const weekDays =
    language === 'en'
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

  const selectedDayData = dailyMap[selectedDay] || { income: 0, expense: 0, net: 0, items: [] };
  const today = new Date();
  const isCurrentMonthYear =
    today.getFullYear() === activeYearNum && today.getMonth() + 1 === activeMonthNum;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Top Summary Strip */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase block truncate">
            {language === 'en' ? 'Active Days' : 'วันที่มีรายการ'}
          </span>
          <p className="text-base sm:text-xl font-black text-slate-800 mt-0.5 font-sans">
            {calendarStats.activeDaysCount}{' '}
            <span className="text-xs font-bold text-slate-400">
              / {daysInMonth} {language === 'en' ? 'days' : 'วัน'}
            </span>
          </p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase block truncate">
            {language === 'en' ? 'Peak Income Day' : 'วันขายดีที่สุด'}
          </span>
          {calendarStats.bestIncomeDay ? (
            <div className="mt-0.5">
              <p className="text-xs sm:text-base font-black text-emerald-600 font-sans truncate">
                +฿{calendarStats.bestIncomeDay.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-slate-400 font-bold">
                {language === 'en' ? `Day ${calendarStats.bestIncomeDay.day}` : `วันที่ ${calendarStats.bestIncomeDay.day}`}
              </span>
            </div>
          ) : (
            <p className="text-xs sm:text-sm font-bold text-slate-400 mt-1">-</p>
          )}
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase block truncate">
            {language === 'en' ? 'Peak Spend Day' : 'วันจ่ายสูงสุด'}
          </span>
          {calendarStats.highestExpenseDay ? (
            <div className="mt-0.5">
              <p className="text-xs sm:text-base font-black text-rose-500 font-sans truncate">
                -฿{calendarStats.highestExpenseDay.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <span className="text-[10px] text-slate-400 font-bold">
                {language === 'en' ? `Day ${calendarStats.highestExpenseDay.day}` : `วันที่ ${calendarStats.highestExpenseDay.day}`}
              </span>
            </div>
          ) : (
            <p className="text-xs sm:text-sm font-bold text-slate-400 mt-1">-</p>
          )}
        </div>
      </div>

      {/* Main Calendar + Day Inspector Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* ================= CALENDAR GRID CARD ================= */}
        <div className="xl:col-span-2 bg-white p-3.5 sm:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm">
          {/* Calendar Header Bar */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <CalendarIcon size={18} />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                  {monthTitle}
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  {language === 'en'
                    ? 'Tap any date to inspect daily cashflow'
                    : 'แตะเลือกวันที่เพื่อดูรายละเอียดรายรับ-รายจ่ายรายวัน'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleStepMonth(-1)}
                className="w-9 h-9 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center text-slate-600 transition-all cursor-pointer active:scale-90"
                title={language === 'en' ? 'Previous Month' : 'เดือนก่อนหน้า'}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => handleStepMonth(1)}
                className="w-9 h-9 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center text-slate-600 transition-all cursor-pointer active:scale-90"
                title={language === 'en' ? 'Next Month' : 'เดือนถัดไป'}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1.5">
            {weekDays.map((wd, idx) => (
              <div
                key={wd}
                className={`text-center text-[10px] sm:text-xs font-extrabold uppercase py-1.5 ${
                  idx === 0 ? 'text-rose-500' : idx === 6 ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Blank leading cells */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="min-h-[58px] sm:min-h-[82px] rounded-xl bg-slate-50/30 border border-transparent"
              />
            ))}

            {/* Date cells */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const data = dailyMap[day];
              const isSelected = selectedDay === day;
              const isToday = isCurrentMonthYear && today.getDate() === day;
              const hasActivity = !!data && (data.income > 0 || data.expense > 0);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[58px] sm:min-h-[82px] p-1 sm:p-2 rounded-xl sm:rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer select-none active:scale-95 relative overflow-hidden ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40'
                      : hasActivity
                        ? 'border-slate-200/80 bg-white hover:border-emerald-300'
                        : 'border-slate-100 bg-slate-50/40 hover:bg-slate-50'
                  }`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-[11px] sm:text-xs font-black w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : isSelected
                            ? 'text-emerald-700 font-black'
                            : 'text-slate-700'
                      }`}
                    >
                      {day}
                    </span>
                    {data?.items && data.items.length > 0 && (
                      <span className="hidden sm:inline-block text-[9px] font-bold text-slate-400">
                        {data.items.length}x
                      </span>
                    )}
                  </div>

                  {/* Daily Income / Expense Indicators */}
                  <div className="w-full space-y-0.5 mt-1">
                    {data?.income > 0 && (
                      <div className="text-[9px] sm:text-[10px] font-extrabold text-emerald-600 bg-emerald-50/90 px-1 py-0.2 rounded truncate leading-tight font-sans">
                        +{formatCompactAmount(data.income)}
                      </div>
                    )}
                    {data?.expense > 0 && (
                      <div className="text-[9px] sm:text-[10px] font-extrabold text-rose-500 bg-rose-50/90 px-1 py-0.2 rounded truncate leading-tight font-sans">
                        -{formatCompactAmount(data.expense)}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= SELECTED DAY INSPECTOR CARD ================= */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            {/* Selected Date Header */}
            <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                  {language === 'en' ? 'Daily Ledger' : 'สรุปรายวัน'}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                  {selectedDateLabel}
                </h3>
              </div>
              {onAddTransaction && (
                <button
                  type="button"
                  onClick={() => {
                    const isoDate = `${activeYearNum}-${String(activeMonthNum).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
                    onAddTransaction(isoDate);
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1 shadow-sm cursor-pointer active:scale-95 transition-all shrink-0"
                >
                  <Plus size={14} />
                  <span>{language === 'en' ? 'Add' : 'เพิ่มรายการ'}</span>
                </button>
              )}
            </div>

            {/* Selected Day Totals */}
            <div className="grid grid-cols-3 gap-2 my-3.5 p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  {t.income}
                </span>
                <span className="text-xs sm:text-sm font-black text-emerald-600 font-sans">
                  +฿{selectedDayData.income.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  {t.expense}
                </span>
                <span className="text-xs sm:text-sm font-black text-rose-500 font-sans">
                  -฿{selectedDayData.expense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  {language === 'en' ? 'Net' : 'สุทธิ'}
                </span>
                <span
                  className={`text-xs sm:text-sm font-black font-sans ${
                    selectedDayData.net >= 0 ? 'text-slate-800' : 'text-rose-500'
                  }`}
                >
                  {selectedDayData.net >= 0 ? '+' : '-'}฿
                  {Math.abs(selectedDayData.net).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Transactions List for Selected Day */}
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-0.5">
              {selectedDayData.items.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
                  <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400">
                    {language === 'en'
                      ? 'No transactions on this date'
                      : 'ไม่มีรายการธุรกรรมในวันนี้'}
                  </p>
                </div>
              ) : (
                selectedDayData.items.map((tx) => {
                  const isIncome = tx.type === 'Income';
                  const displayCat =
                    tx.category === 'order'
                      ? language === 'en'
                        ? 'Order'
                        : 'รายรับ (ออร์เดอร์)'
                      : t[tx.category as keyof typeof t] || tx.category;

                  return (
                    <div
                      key={tx.id}
                      className="p-3 bg-slate-50/60 hover:bg-emerald-50/20 border border-slate-100 rounded-2xl flex items-center justify-between gap-2 transition-all"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                          {tx.item}
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200/60 text-slate-600 truncate max-w-[140px]">
                          {displayCat}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`text-xs sm:text-sm font-black font-sans mr-1 ${
                            isIncome ? 'text-emerald-600' : 'text-rose-500'
                          }`}
                        >
                          {isIncome ? '+' : '-'}฿
                          {Math.abs(tx.amount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTx(tx);
                            setIsEditOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title={language === 'en' ? 'Edit' : 'แก้ไข'}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTx(tx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title={language === 'en' ? 'Delete' : 'ลบ'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <EditTransactionModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingTx(null);
        }}
        transaction={editingTx}
        onSave={async (updated) => {
          await updateTxMutation.mutateAsync(updated);
        }}
      />
    </div>
  );
};

export default CalendarCashflowView;
