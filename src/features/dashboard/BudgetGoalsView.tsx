'use client';

import React, { useState, useMemo } from 'react';
import { 
  PiggyBank, 
  Target, 
  Plus, 
  Trash2, 
  Coins, 
  Calendar, 
  PlusCircle, 
  AlertCircle, 
  Sparkles,
  DollarSign
} from 'lucide-react';
import { Progress, Modal, Form, Input, InputNumber, DatePicker, Select, App } from 'antd';
import dayjs from 'dayjs';
import { useTranslation } from '@/hooks/useLanguageStore';
import type { Transaction } from '@/hooks/useTransactions';
import { 
  useBudgets, 
  useSaveBudget, 
  useDeleteBudget, 
  useSavingsGoals, 
  useSaveSavingsGoal, 
  useAddContributionToGoal, 
  useDeleteSavingsGoal 
} from '@/hooks/useBudgetGoals';
import { useCategoriesDescriptions } from '@/hooks/useTransactions';

interface BudgetGoalsViewProps {
  transactions: Transaction[];
  selectedMonth: string;
  selectedYear: string;
}

const BudgetGoalsView: React.FC<BudgetGoalsViewProps> = ({ 
  transactions, 
  selectedMonth, 
  selectedYear 
}) => {
  const { language, t } = useTranslation();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [goalForm] = Form.useForm();
  const [contributionForm] = Form.useForm();

  // Dialog open states
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  
  // Selected goal state for adding money
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);

  // Queries
  const { data: budgetsList = [], isLoading: isBudgetsLoading } = useBudgets(selectedMonth, selectedYear);
  const { data: goalsList = [], isLoading: isGoalsLoading } = useSavingsGoals();
  const { data: categoriesMap = { expenses: {}, income: {} } } = useCategoriesDescriptions();

  // Mutations
  const saveBudgetMutation = useSaveBudget();
  const deleteBudgetMutation = useDeleteBudget();
  const saveGoalMutation = useSaveSavingsGoal();
  const addContributionMutation = useAddContributionToGoal();
  const deleteGoalMutation = useDeleteSavingsGoal();

  // Unique categories for the budget modal dropdown
  const dbExpenseCategories = Object.keys(categoriesMap.expenses || {});
  const expenseCategories = dbExpenseCategories.length > 0 
    ? dbExpenseCategories 
    : ['Food & Dining', 'Shopping', 'Transportation', 'Entertainment', 'Bills & Utilities', 'Other Expenses'];

  // Calculate actual spent per category for the current selected month/year
  const categorySpends = useMemo(() => {
    const mapping: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.amount < 0) {
        const cat = t.category || 'Other Expenses';
        mapping[cat] = (mapping[cat] || 0) + Math.abs(t.amount);
      }
    });
    return mapping;
  }, [transactions]);

  // Combine budgets with spent amounts and calculate percentages
  const budgetProgressList = useMemo(() => {
    return budgetsList.map(b => {
      const spent = categorySpends[b.category] || 0;
      const limit = parseFloat(b.amount) || 0;
      const percent = limit > 0 ? (spent / limit) * 100 : 0;
      
      // Dynamic colors based on budget thresholds
      let statusColor = '#10b981'; // Green
      if (percent >= 100) {
        statusColor = '#f43f5e'; // Red (Over budget)
      } else if (percent >= 80) {
        statusColor = '#f59e0b'; // Amber (Approaching limit)
      }

      return {
        ...b,
        spent,
        limit,
        percent,
        color: statusColor
      };
    });
  }, [budgetsList, categorySpends]);

  // Form Submit Handlers
  const handleSaveBudget = async (values: any) => {
    try {
      await saveBudgetMutation.mutateAsync({
        category: values.category,
        amount: values.amount,
        month: selectedMonth,
        year: selectedYear
      });
      message.success(language === 'en' ? 'Budget set successfully!' : 'ตั้งงบประมาณเรียบร้อยแล้ว!');
      setIsBudgetModalOpen(false);
      form.resetFields();
    } catch (err: any) {
      message.error(err.message || 'Failed to save budget');
    }
  };

  const handleDeleteBudget = (budgetId: number, category: string) => {
    Modal.confirm({
      title: language === 'en' ? 'Delete Budget Limit?' : 'ยกเลิกงบประมาณนี้?',
      content: language === 'en' 
        ? `Are you sure you want to delete the budget limit for "${category}"?` 
        : `คุณแน่ใจที่จะลบงบประมาณจำกัดค่าใช้จ่ายสำหรับ "${t[category as keyof typeof t] || category}"?`,
      okText: language === 'en' ? 'Delete' : 'ลบออก',
      okType: 'danger',
      cancelText: language === 'en' ? 'Cancel' : 'ยกเลิก',
      onOk: async () => {
        try {
          await deleteBudgetMutation.mutateAsync(budgetId);
          message.success(language === 'en' ? 'Budget limit removed' : 'ลบงบประมาณเรียบร้อยแล้ว');
        } catch (err: any) {
          message.error(err.message || 'Failed to delete budget');
        }
      }
    });
  };

  const handleSaveGoal = async (values: any) => {
    try {
      await saveGoalMutation.mutateAsync({
        name: values.name,
        targetAmount: values.targetAmount,
        currentAmount: values.currentAmount || 0,
        targetDate: values.targetDate ? values.targetDate.format('YYYY-MM-DD') : null
      });
      message.success(language === 'en' ? 'Savings goal created!' : 'สร้างเป้าหมายการออมสำเร็จ!');
      setIsGoalModalOpen(false);
      goalForm.resetFields();
    } catch (err: any) {
      message.error(err.message || 'Failed to save goal');
    }
  };

  const handleAddContribution = async (values: any) => {
    if (selectedGoalId === null) return;
    try {
      await addContributionMutation.mutateAsync({
        goalId: selectedGoalId,
        amountToAdd: values.amountToAdd
      });
      message.success(language === 'en' ? 'Contribution added to goal!' : 'เพิ่มเงินออมเป้าหมายเรียบร้อยแล้ว!');
      setIsContributionModalOpen(false);
      contributionForm.resetFields();
      setSelectedGoalId(null);
    } catch (err: any) {
      message.error(err.message || 'Failed to add contribution');
    }
  };

  const handleDeleteGoal = (goalId: number, goalName: string) => {
    Modal.confirm({
      title: language === 'en' ? 'Delete Savings Goal?' : 'ยกเลิกเป้าหมายออมเงิน?',
      content: language === 'en' 
        ? `Are you sure you want to delete the goal "${goalName}"? All savings history for this goal will be lost.` 
        : `คุณแน่ใจที่จะลบเป้าหมาย "${goalName}"? ประวัติการออมทั้งหมดในเป้าหมายนี้จะถูกลบออกถาวร`,
      okText: language === 'en' ? 'Delete' : 'ลบออก',
      okType: 'danger',
      cancelText: language === 'en' ? 'Cancel' : 'ยกเลิก',
      onOk: async () => {
        try {
          await deleteGoalMutation.mutateAsync(goalId);
          message.success(language === 'en' ? 'Savings goal deleted' : 'ลบเป้าหมายเรียบร้อยแล้ว');
        } catch (err: any) {
          message.error(err.message || 'Failed to delete goal');
        }
      }
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn text-slate-800">
      
      {/* Page header introduction banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 md:p-8 rounded-3xl text-white shadow-md border border-emerald-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fadeIn">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
            {language === 'en' ? 'Financial Planning' : 'การวางแผนการเงินเชิงรุก'}
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
            {language === 'en' ? 'Budgets & Savings Goals' : 'ระบบงบประมาณและเงินออมเป้าหมาย'}
          </h2>
          <p className="text-sm text-emerald-200/80 mt-1 font-medium font-sans">
            {language === 'en' 
              ? 'Limit category expenditures and accumulate capital for targeted investments'
              : 'จำกัดค่าใช้จ่ายรายเดือนแยกตามหมวดหมู่ และสะสมเงินเพื่อลงทุนจัดหาอุปกรณ์จำเป็น'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ================= BUDGETS CONTAINER ================= */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Coins className="text-emerald-600" size={20} />
                {language === 'en' ? 'Category Spending Limits' : 'งบประมาณจำกัดรายจ่ายประจำเดือน'}
              </h3>
              <p className="text-xs text-slate-400 font-bold tracking-wide uppercase mt-1">
                {language === 'en' ? 'Limit spent per category' : 'จำกัดรายจ่ายแยกตามหมวดหมู่สินค้า'}
              </p>
            </div>
            <button 
              onClick={() => setIsBudgetModalOpen(true)}
              className="bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-emerald-100 transition-colors flex items-center gap-1 border border-emerald-100 cursor-pointer"
            >
              <Plus size={14} />
              <span>{language === 'en' ? 'Set Budget' : 'ตั้งงบประมาณ'}</span>
            </button>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto max-h-[480px] pr-2">
            {isBudgetsLoading ? (
              <div className="text-center py-12 text-slate-400 font-bold">Loading...</div>
            ) : budgetProgressList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-sans font-medium border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 bg-slate-50/50">
                <AlertCircle className="text-slate-300" size={28} />
                <span>{language === 'en' ? 'No budgets configured for this month.' : 'ยังไม่ได้ตั้งค่าจำกัดงบประมาณประจำเดือนนี้'}</span>
              </div>
            ) : (
              budgetProgressList.map((b) => {
                const displayCat = b.category === 'order'
                  ? (language === 'en' ? 'Order' : 'รายรับ (ออร์เดอร์)')
                  : (t[b.category as keyof typeof t] || b.category);

                return (
                  <div key={b.budgetId} className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-emerald-100 transition-all group relative">
                    <button 
                      onClick={() => handleDeleteBudget(b.budgetId, b.category)}
                      className="absolute top-4 right-4 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="font-extrabold text-sm text-slate-800">{displayCat}</span>
                      <div className="text-right pr-6">
                        <span className="text-xs text-slate-500 font-semibold font-sans block">
                          {language === 'en' ? 'Spent: ' : 'จ่ายแล้ว: '}
                          <strong className="text-slate-800 font-bold">฿{b.spent.toLocaleString()}</strong>
                          {` / ฿${b.limit.toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                    <Progress 
                      percent={Math.min(100, parseFloat(b.percent.toFixed(1)))} 
                      strokeColor={b.color} 
                      railColor="#e2e8f0"
                      size={['100%', 10]}
                      format={() => `${b.percent.toFixed(0)}%`}
                      className="font-bold text-xs"
                    />
                    {b.percent >= 100 && (
                      <p className="text-[10px] text-rose-500 font-black uppercase mt-1 flex items-center gap-1">
                        ⚠️ {language === 'en' ? 'Over budget limit!' : 'จ่ายเกินเป้าหมายงบประมาณที่กำหนดแล้ว!'}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================= SAVINGS GOALS CONTAINER ================= */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <PiggyBank className="text-emerald-600" size={20} />
                {language === 'en' ? 'Capital Savings Goals' : 'เป้าหมายการสะสมทุนและเงินออม'}
              </h3>
              <p className="text-xs text-slate-400 font-bold tracking-wide uppercase mt-1">
                {language === 'en' ? 'Accumulate capital for targets' : 'บันทึกเงินออมเพื่อการลงทุนส่วนตัว/ร้านค้า'}
              </p>
            </div>
            <button 
              onClick={() => setIsGoalModalOpen(true)}
              className="bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-emerald-100 transition-colors flex items-center gap-1 border border-emerald-100 cursor-pointer"
            >
              <Plus size={14} />
              <span>{language === 'en' ? 'Create Goal' : 'สร้างเป้าหมาย'}</span>
            </button>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto max-h-[480px] pr-2">
            {isGoalsLoading ? (
              <div className="text-center py-12 text-slate-400 font-bold">Loading...</div>
            ) : goalsList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-sans font-medium border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 bg-slate-50/50">
                <Target className="text-slate-300" size={28} />
                <span>{language === 'en' ? 'No savings goals set yet.' : 'ยังไม่มีการสร้างเป้าหมายเก็บเงินออม'}</span>
              </div>
            ) : (
              goalsList.map((g) => {
                const target = parseFloat(g.targetAmount) || 1;
                const current = parseFloat(g.currentAmount) || 0;
                const percent = Math.min(100, (current / target) * 100);

                return (
                  <div key={g.goalId} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:border-emerald-100 transition-all group relative">
                    <button 
                      onClick={() => handleDeleteGoal(g.goalId, g.name)}
                      className="absolute top-4 right-4 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-extrabold text-base text-slate-800">{g.name}</span>
                      <span className="text-xs text-slate-400 font-bold pr-6">
                        {g.targetDate ? `📅 ${dayjs(g.targetDate).format('DD/MM/YYYY')}` : ''}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline mb-3">
                      <span className="text-sm font-black text-emerald-700 font-sans">
                        ฿{current.toLocaleString()}
                        <span className="text-xs text-slate-400 font-medium font-sans">
                          {` / ฿${target.toLocaleString()}`}
                        </span>
                      </span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        {percent.toFixed(0)}%
                      </span>
                    </div>

                    <Progress 
                      percent={percent} 
                      strokeColor="#10b981" 
                      railColor="#e2e8f0"
                      size={['100%', 10]}
                      showInfo={false}
                    />

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedGoalId(g.goalId);
                          setIsContributionModalOpen(true);
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                      >
                        <PlusCircle size={14} />
                        <span>{language === 'en' ? 'Add Savings' : 'บันทึกเงินออมสะสม'}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ================= MODALS FOR ACTION ================= */}

      {/* 1. Set Budget Modal */}
      <Modal
        open={isBudgetModalOpen}
        onCancel={() => {
          setIsBudgetModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        destroyOnHidden
        width={400}
        className="premium-antd-modal"
        title={
          <div>
            <h2 className="text-xl font-black !text-slate-900 tracking-tight leading-none">
              {language === 'en' ? 'Set Category Budget' : 'กำหนดงบประมาณค่าใช้จ่าย'}
            </h2>
            <p className="text-xs !text-slate-500 font-bold mt-1 font-sans">
              {language === 'en' 
                ? `Set monthly limit for ${selectedMonth}/${selectedYear}` 
                : `กำหนดเกณฑ์ใช้จ่ายสูงสุดประจำเดือน ${selectedMonth}/${selectedYear}`}
            </p>
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSaveBudget} className="mt-6 space-y-4">
          <Form.Item
            name="category"
            label={<span className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">{t.formCategory}</span>}
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select
              size="large"
              className="font-bold text-slate-800 rounded-xl"
              options={expenseCategories.map(cat => ({
                label: t[cat as keyof typeof t] || cat,
                value: cat
              }))}
              style={{ height: '46px' }}
            />
          </Form.Item>

          <Form.Item
            name="amount"
            label={<span className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">{t.formAmount} (฿)</span>}
            rules={[{ required: true, message: 'Please enter a valid amount' }]}
          >
            <InputNumber
              className="w-full font-bold text-slate-800 rounded-xl"
              size="large"
              placeholder="0.00"
              min={1}
              precision={2}
              style={{ height: '46px', display: 'flex', alignItems: 'center' }}
            />
          </Form.Item>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={() => setIsBudgetModalOpen(false)}
              className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 text-xs border border-slate-200 cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 text-xs cursor-pointer shadow-sm"
            >
              {language === 'en' ? 'Save' : 'บันทึก'}
            </button>
          </div>
        </Form>
      </Modal>

      {/* 2. Create Goal Modal */}
      <Modal
        open={isGoalModalOpen}
        onCancel={() => {
          setIsGoalModalOpen(false);
          goalForm.resetFields();
        }}
        footer={null}
        destroyOnHidden
        width={420}
        className="premium-antd-modal"
        title={
          <div>
            <h2 className="text-xl font-black !text-slate-900 tracking-tight leading-none">
              {language === 'en' ? 'Create Savings Goal' : 'สร้างเป้าหมายเก็บออมเงิน'}
            </h2>
            <p className="text-xs !text-slate-500 font-bold mt-1.5 font-sans">
              {language === 'en' ? 'Save money for purchasing tools or inventory' : 'กำหนดเป้าหมายเก็บออมเพื่อจัดหาคอมพิวเตอร์ อุปกรณ์ หรือขยายสาขา'}
            </p>
          </div>
        }
      >
        <Form form={goalForm} layout="vertical" onFinish={handleSaveGoal} className="mt-6 space-y-4">
          <Form.Item
            name="name"
            label={<span className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">{language === 'en' ? 'Goal Name' : 'ชื่อเป้าหมาย'}</span>}
            rules={[{ required: true, message: 'Please enter goal name' }]}
          >
            <Input 
              placeholder={language === 'en' ? 'e.g. New POS Printer' : 'เช่น เครื่องสแกนบาร์โค้ด'} 
              size="large"
              className="font-bold text-slate-800 rounded-xl"
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="targetAmount"
              label={<span className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">{language === 'en' ? 'Target (฿)' : 'จำนวนเป้าหมาย'}</span>}
              rules={[{ required: true, message: 'Please enter target amount' }]}
            >
              <InputNumber
                className="w-full font-bold text-slate-800 rounded-xl"
                size="large"
                placeholder="0.00"
                min={1}
                precision={2}
                style={{ height: '46px', display: 'flex', alignItems: 'center' }}
              />
            </Form.Item>

            <Form.Item
              name="currentAmount"
              label={<span className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">{language === 'en' ? 'Initial Saved (฿)' : 'เงินตั้งต้นสะสม'}</span>}
            >
              <InputNumber
                className="w-full font-bold text-slate-800 rounded-xl"
                size="large"
                placeholder="0.00"
                min={0}
                precision={2}
                style={{ height: '46px', display: 'flex', alignItems: 'center' }}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="targetDate"
            label={<span className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">{language === 'en' ? 'Target Date (Optional)' : 'วันสิ้นสุดเป้าหมาย (เลือกหรือไม่ก็ได้)'}</span>}
          >
            <DatePicker
              size="large"
              className="w-full font-bold text-slate-800"
              format="DD/MM/YYYY"
              style={{ height: '46px' }}
              inputReadOnly={true}
            />
          </Form.Item>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={() => setIsGoalModalOpen(false)}
              className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 text-xs border border-slate-200 cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 text-xs cursor-pointer shadow-sm"
            >
              {language === 'en' ? 'Create' : 'สร้าง'}
            </button>
          </div>
        </Form>
      </Modal>

      {/* 3. Add Contribution Modal */}
      <Modal
        open={isContributionModalOpen}
        onCancel={() => {
          setIsContributionModalOpen(false);
          contributionForm.resetFields();
          setSelectedGoalId(null);
        }}
        footer={null}
        destroyOnHidden
        width={350}
        className="premium-antd-modal"
        title={
          <div>
            <h2 className="text-xl font-black !text-slate-900 tracking-tight leading-none">
              {language === 'en' ? 'Add Contribution' : 'บันทึกการออมสมทบ'}
            </h2>
            <p className="text-xs !text-slate-500 font-bold mt-1 font-sans">
              {language === 'en' ? 'Input the amount saved for this goal' : 'กรอกยอดเงินที่คุณต้องการหยอดกระปุกสะสมในรายการนี้'}
            </p>
          </div>
        }
      >
        <Form form={contributionForm} layout="vertical" onFinish={handleAddContribution} className="mt-6 space-y-4">
          <Form.Item
            name="amountToAdd"
            label={<span className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">{language === 'en' ? 'Amount (฿)' : 'จำนวนเงินที่ออมเพิ่ม'}</span>}
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber
              className="w-full font-bold text-slate-800 rounded-xl"
              size="large"
              placeholder="0.00"
              min={0.01}
              precision={2}
              style={{ height: '46px', display: 'flex', alignItems: 'center' }}
              autoFocus
            />
          </Form.Item>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={() => {
                setIsContributionModalOpen(false);
                setSelectedGoalId(null);
              }}
              className="px-4 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 text-xs border border-slate-200 cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 text-xs cursor-pointer shadow-sm"
            >
              {language === 'en' ? 'Save' : 'บันทึกการออม'}
            </button>
          </div>
        </Form>
      </Modal>

    </div>
  );
};

export default BudgetGoalsView;
