'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Select, Segmented, ConfigProvider, App } from 'antd';
import dayjs from 'dayjs';
import { useCategoriesDescriptions, Transaction } from '@/hooks/useTransactions';
import { useTranslation } from '@/hooks/useLanguageStore';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSave: (transaction: {
    id: string;
    item: string;
    type: 'income' | 'expense';
    category: string;
    amount: number;
    date: string;
  }) => void;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  transaction, 
  onSave 
}) => {
  const { language, t } = useTranslation();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('');
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load category and description metadata from Postgres
  const { data: metaMap = { expenses: {}, income: {} } } = useCategoriesDescriptions();

  // Check type is income
  const isIncome = type === 'income';

  // Get current active categories mapping depending on type
  const activeMap = isIncome ? (metaMap.income || {}) : (metaMap.expenses || {});

  // Set categories lists
  const expenseCategories = Object.keys(metaMap.expenses || {}).length > 0 
    ? Object.keys(metaMap.expenses || {}) 
    : ['Food & Dining', 'Shopping', 'Transportation', 'Entertainment', 'Bills & Utilities', 'Other Expenses'];

  const incomeCategories = Object.keys(metaMap.income || {}).length > 0 
    ? Object.keys(metaMap.income || {}) 
    : ['order', 'salary', 'investment', 'other income'];

  // Description / Item selection states
  const descriptionsList = activeMap[category] || [];
  const [isCustomMode, setIsCustomMode] = useState(true);

  // Sync form values and type when transaction details are loaded or modal opens
  useEffect(() => {
    if (isOpen && transaction) {
      setIsCustomCategoryMode(false);
      const txType = transaction.type.toLowerCase() as 'income' | 'expense';
      setType(txType);
      setCategory(transaction.category);
      
      const parsedDate = dayjs(transaction.date, 'DD/MM/YYYY');
      const absoluteAmount = Math.abs(transaction.amount);

      form.setFieldsValue({
        type: txType,
        amount: absoluteAmount,
        category: transaction.category,
        date: parsedDate.isValid() ? parsedDate : dayjs(),
        item: transaction.item
      });

      // Check if item is in the matching metadata suggestions list
      const list = (txType === 'income' ? metaMap.income : metaMap.expenses)?.[transaction.category] || [];
      if (list.includes(transaction.item)) {
        setIsCustomMode(false);
      } else {
        setIsCustomMode(true);
      }
    }
  }, [isOpen, transaction, form, metaMap]);

  // Sync descriptions dropdown when category changes
  useEffect(() => {
    if (!category) return;
    const list = activeMap[category] || [];
    // Only auto-change if we're not loading the initial transaction values
    if (isOpen && transaction && form.getFieldValue('category') !== transaction.category) {
      if (list.length > 0) {
        form.setFieldValue('item', list[0]);
        setIsCustomMode(false);
      } else {
        form.setFieldValue('item', '');
        setIsCustomMode(true);
      }
    }
  }, [category, activeMap, form, isOpen, transaction]);

  const handleSubmit = async (values: any) => {
    if (!transaction) return;
    setLoading(true);
    try {
      const amountVal = values.amount;
      if (!amountVal) return;

      let itemVal = (values.item || '').trim();
      if (type === 'income' && !itemVal) {
        itemVal = language === 'en' ? 'Sales Revenue' : 'รายได้การขาย'; // Default for Income
      }

      await onSave({
        id: transaction.id,
        item: itemVal,
        type,
        category: values.category,
        amount: amountVal,
        date: values.date.format('YYYY-MM-DD') // Formats as YYYY-MM-DD
      });

      message.success(language === 'en' ? 'Transaction updated successfully!' : 'แก้ไขรายการเรียบร้อยแล้ว!');
      onClose();
    } catch (err: any) {
      message.error(err.message || 'Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  // --- Dynamic Color Shifting tokens ---
  const localTheme = {
    token: {
      colorPrimary: isIncome ? '#10b981' : '#f43f5e', // Emerald green vs Rose red
      borderRadius: 16,
      fontFamily: 'Inter, system-ui, sans-serif'
    }
  };

  const submitButtonClass = isIncome
    ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-100/50 hover:shadow-emerald-100 focus:ring-4 focus:ring-emerald-100'
    : 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-100/50 hover:shadow-rose-100 focus:ring-4 focus:ring-rose-100';

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      forceRender
      width={480}
      style={{ maxWidth: 'calc(100vw - 24px)', top: 20 }}
      className="premium-antd-modal"
      title={
        <div>
          <h2 className="text-2xl font-black !text-slate-900 tracking-tight leading-none">
            {language === 'en' ? 'Edit Transaction' : 'แก้ไขรายการบัญชี'}
          </h2>
          <p className="text-xs !text-slate-500 font-bold mt-1.5 font-sans">
            {language === 'en' 
              ? 'Modify details for this financial ledger record' 
              : 'แก้ไขรายละเอียดการลงบัญชีรายการรับหรือรายจ่ายนี้'}
          </p>
        </div>
      }
    >
      <ConfigProvider theme={localTheme}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-6 space-y-4"
        >
          {/* Income vs Expense sliding segmented controller */}
          <Form.Item name="type" className="mb-4 animate-fadeIn">
            <Segmented
              block
              size="large"
              options={[
                { label: t.income, value: 'income' },
                { label: t.expense, value: 'expense' }
              ]}
              onChange={(val) => {
                setType(val as 'income' | 'expense');
              }}
            />
          </Form.Item>

          {/* Amount input */}
          <Form.Item
            name="amount"
            label={<span className="font-extrabold !text-slate-700 uppercase tracking-wider text-[11px]">{t.formAmount} (฿)</span>}
            rules={[{ required: true, message: language === 'en' ? 'Please enter a valid amount' : 'กรุณากรอกจำนวนเงินที่ถูกต้อง' }]}
          >
            <InputNumber
              className="w-full font-bold !text-slate-900"
              size="large"
              placeholder="0.00"
              min={0.01}
              precision={2}
              inputMode="decimal"
              style={{ height: '46px', display: 'flex', alignItems: 'center' }}
            />
          </Form.Item>

          {/* Category & Date in a responsive 1-col (mobile) / 2-col (desktop) layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <Form.Item
              name="category"
              className="mb-0"
              label={<span className="font-extrabold !text-slate-700 uppercase tracking-wider text-[11px]">{t.formCategory}</span>}
              rules={[{ required: true, message: language === 'en' ? 'Please select or type a category' : 'กรุณาเลือกหรือกรอกหมวดหมู่' }]}
            >
              {!isCustomCategoryMode ? (
                <Select
                  size="large"
                  className="font-bold !text-slate-900 w-full"
                  onChange={(val) => {
                    if (val === '__custom_category__') {
                      setIsCustomCategoryMode(true);
                      form.setFieldValue('category', '');
                    } else {
                      setCategory(val);
                    }
                  }}
                  options={[
                    ...(isIncome ? incomeCategories : expenseCategories).map(cat => ({
                      label: cat === 'order' ? (language === 'en' ? 'Order' : 'รายรับ (ออร์เดอร์)') : (t[cat as keyof typeof t] || cat),
                      value: cat
                    })),
                    {
                      label: language === 'en' ? '+ Add custom category...' : '+ เพิ่มหมวดหมู่ใหม่...',
                      value: '__custom_category__'
                    }
                  ]}
                  style={{ height: '46px' }}
                />
              ) : (
                <div className="flex gap-2">
                  <Input
                    size="large"
                    placeholder={
                      language === 'en' 
                        ? "e.g. Pets, Rent" 
                        : "เช่น สัตว์เลี้ยง, ค่าเช่า"
                    }
                    className="font-bold !text-slate-900"
                    style={{ height: '46px' }}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategoryMode(false);
                      const defaultCat = isIncome 
                        ? (incomeCategories[0] || 'order') 
                        : (expenseCategories[0] || 'Food & Dining');
                      setCategory(defaultCat);
                      form.setFieldValue('category', defaultCat);
                    }}
                    className="text-xs font-black text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 rounded-xl border border-emerald-100 shrink-0 transition-colors cursor-pointer"
                    style={{ height: '46px' }}
                  >
                    {language === 'en' ? 'Select Existing' : 'เลือกหมวดเดิม'}
                  </button>
                </div>
              )}
            </Form.Item>

            <Form.Item
              name="date"
              className="mb-0"
              label={<span className="font-extrabold !text-slate-700 uppercase tracking-wider text-[11px]">{t.formDate}</span>}
              rules={[{ required: true, message: language === 'en' ? 'Please select a date' : 'กรุณาเลือกวันที่ทำรายการ' }]}
            >
              <DatePicker
                size="large"
                className="w-full font-bold !text-slate-900"
                format="DD/MM/YYYY"
                placeholder={t.datePickerPlaceholder}
                style={{ height: '46px' }}
                inputReadOnly={true}
              />
            </Form.Item>
          </div>

          {/* Description input with sub-dropdown selectors */}
          <Form.Item
            name="item"
            label={<span className="font-extrabold !text-slate-700 uppercase tracking-wider text-[11px]">{t.formDescription}</span>}
            rules={[{ required: !isIncome, message: language === 'en' ? 'Description is required' : 'กรุณากรอกรายละเอียดรายการนี้' }]}
          >
            {!isCustomMode && descriptionsList.length > 0 ? (
              <Select
                size="large"
                className="font-bold !text-slate-900"
                onChange={(val) => {
                  if (val === '__custom__') {
                    setIsCustomMode(true);
                    form.setFieldValue('item', '');
                  }
                }}
                options={[
                  ...descriptionsList.map(desc => ({ label: desc, value: desc })),
                  { 
                    label: language === 'en' ? '+ Type a custom description...' : '+ พิมพ์คำอธิบายด้วยตัวเอง...', 
                    value: '__custom__' 
                  }
                ]}
                style={{ height: '46px' }}
              />
            ) : (
              <div className="flex gap-2">
                <Input
                  size="large"
                  placeholder={
                    isIncome
                      ? (language === 'en' ? "e.g. POS Sales Deposit (Optional)" : "เช่น รายได้การขายหน้าร้าน (ระบุหรือไม่ก็ได้)")
                      : (language === 'en' ? "e.g. Starbucks Coffee, Office Rent" : "เช่น ค่ากาแฟสตาร์บัคส์, ค่าเช่าร้าน")
                  }
                  className="font-bold !text-slate-900"
                  style={{ height: '46px' }}
                />
                {descriptionsList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomMode(false);
                      form.setFieldValue('item', descriptionsList[0]);
                    }}
                    className="text-xs font-black text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 rounded-xl border border-emerald-100 shrink-0 transition-colors cursor-pointer"
                    style={{ height: '46px' }}
                  >
                    {language === 'en' ? 'Select Existing' : 'เลือกประวัติเดิม'}
                  </button>
                )}
              </div>
            )}
          </Form.Item>

          {/* Action button triggers */}
          <div className="pt-4 flex justify-end gap-2.5 sm:gap-3 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold !text-slate-600 hover:bg-slate-100 transition-colors text-sm border border-slate-200 hover:border-slate-300 cursor-pointer"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-extrabold text-white transition-all text-sm cursor-pointer disabled:opacity-50 ${submitButtonClass}`}
            >
              {loading ? (language === 'en' ? 'Saving...' : 'กำลังบันทึก...') : (language === 'en' ? 'Save Changes' : 'บันทึกการแก้ไข')}
            </button>
          </div>
        </Form>
      </ConfigProvider>
    </Modal>
  );
};

export default EditTransactionModal;
