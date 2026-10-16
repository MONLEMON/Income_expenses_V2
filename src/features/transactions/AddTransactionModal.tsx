'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Form, Input, InputNumber, DatePicker, Select, Segmented, ConfigProvider, theme as antdTheme } from 'antd';
import { Search, Sparkles, Zap, CheckCircle2, X } from 'lucide-react';
import dayjs from 'dayjs';
import { useCategoriesDescriptions, useTransactions } from '@/hooks/useTransactions';
import { useTranslation } from '@/hooks/useLanguageStore';
import { useThemeStore } from '@/hooks/useThemeStore';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string | null;
  onAdd: (transaction: {
    item: string;
    type: 'income' | 'expense';
    category: string;
    amount: number;
    date: string;
  }) => void;
}

interface SmartCatalogItem {
  item: string;
  category: string;
  type: 'income' | 'expense';
  lastAmount?: number;
  count: number;
  isKeywordRule?: boolean;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, initialDate, onAdd }) => {
  const { language, t } = useTranslation();
  const isDark = useThemeStore((state) => state.theme === 'dark');
  const [form] = Form.useForm();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('Food & Dining');
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);

  // Smart Quick-Search states
  const [quickSearch, setQuickSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [autoMappedInfo, setAutoMappedInfo] = useState<SmartCatalogItem | null>(null);

  // Load category and description metadata + recent transactions from cache
  const { data: metaMap = { expenses: {}, income: {} } } = useCategoriesDescriptions();
  const { data: transactions = [] } = useTransactions();

  // Check type is income
  const isIncome = type === 'income';

  // Get current active categories mapping depending on type
  const activeMap = isIncome ? (metaMap.income || {}) : (metaMap.expenses || {});

  // Set categories lists
  const expenseCategories = useMemo(
    () =>
      Object.keys(metaMap.expenses || {}).length > 0
        ? Object.keys(metaMap.expenses || {})
        : ['Food & Dining', 'Shopping', 'Transportation', 'Entertainment', 'Bills & Utilities', 'Other Expenses'],
    [metaMap.expenses]
  );

  const incomeCategories = useMemo(
    () =>
      Object.keys(metaMap.income || {}).length > 0
        ? Object.keys(metaMap.income || {})
        : ['order', 'salary', 'investment', 'other income'],
    [metaMap.income]
  );

  // Build unified Smart Catalog from database dictionary + past transactions
  const smartCatalog = useMemo(() => {
    const map = new Map<string, SmartCatalogItem>();

    // 1. Seed from categories-descriptions dictionary
    Object.entries(metaMap.expenses || {}).forEach(([cat, items]) => {
      (items || []).forEach((desc) => {
        const clean = desc.trim();
        if (!clean) return;
        const key = `expense:${clean.toLowerCase()}`;
        if (!map.has(key)) {
          map.set(key, { item: clean, category: cat, type: 'expense', count: 1 });
        }
      });
    });

    Object.entries(metaMap.income || {}).forEach(([cat, items]) => {
      (items || []).forEach((desc) => {
        const clean = desc.trim();
        if (!clean) return;
        const key = `income:${clean.toLowerCase()}`;
        if (!map.has(key)) {
          map.set(key, { item: clean, category: cat, type: 'income', count: 1 });
        }
      });
    });

    // 2. Enrich with frequency & latest amount from actual transactions
    transactions.forEach((tx) => {
      const clean = (tx.item || '').trim();
      if (!clean) return;
      const txType: 'income' | 'expense' = tx.type === 'Income' ? 'income' : 'expense';
      const key = `${txType}:${clean.toLowerCase()}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        if (existing.lastAmount === undefined) {
          existing.lastAmount = Math.abs(tx.amount);
        }
        if (tx.category) {
          existing.category = tx.category;
        }
      } else {
        map.set(key, {
          item: clean,
          category: tx.category || (txType === 'income' ? 'order' : 'Other Expenses'),
          type: txType,
          lastAmount: Math.abs(tx.amount),
          count: 2,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [metaMap, transactions]);

  // Top frequent items for 1-tap quick chips
  const topFrequentItems = useMemo(() => {
    return smartCatalog.slice(0, 6);
  }, [smartCatalog]);

  // Smart keyword inference for brand-new search terms (e.g. "ค่าน้ำแข็ง", "ค่าไฟ")
  const inferKeywordSuggestion = (rawQuery: string): SmartCatalogItem | null => {
    const q = rawQuery.trim();
    if (!q) return null;
    const lower = q.toLowerCase();

    const hasDrinkCat = expenseCategories.some((c) => c.toLowerCase() === 'drink');
    const drinkCat = expenseCategories.find((c) => c.toLowerCase() === 'drink') || expenseCategories[0] || 'Food & Dining';
    const foodCat = expenseCategories.find((c) => c.toLowerCase().includes('food')) || expenseCategories[0] || 'Food & Dining';
    const billCat = expenseCategories.find((c) => c.toLowerCase().includes('bill') || c.toLowerCase().includes('service') || c.toLowerCase().includes('sevice')) || 'Bills & Utilities';
    const transCat = expenseCategories.find((c) => c.toLowerCase().includes('trans')) || 'Transportation';
    const shopCat = expenseCategories.find((c) => c.toLowerCase().includes('shop')) || 'Shopping';
    const orderCat = incomeCategories.find((c) => c.toLowerCase() === 'order') || incomeCategories[0] || 'order';

    if (/น้ำแข็ง|กาแฟ|ชา|นม|น้ำดื่ม|น้ำหวาน|โซดา|โกโก้|เครื่องดื่ม|ice|coffee|tea|drink/.test(lower)) {
      return { item: q, category: hasDrinkCat ? drinkCat : foodCat, type: 'expense', count: 0, isKeywordRule: true };
    }
    if (/ข้าว|อาหาร|ก๋วยเตี๋ยว|หมู|ไก่|เนื้อ|ผัก|ผลไม้|ลูกชิ้น|วัตถุดิบ|ซอส|food|lunch|dinner/.test(lower)) {
      return { item: q, category: foodCat, type: 'expense', count: 0, isKeywordRule: true };
    }
    if (/ค่าไฟ|ค่าน้ำประปา|ค่าน้ำ|ค่าเน็ต|อินเทอร์เน็ต|ค่าเช่า|ค่าบริการ|ซ่อม|โทรศัพท์|บิล|electric|water|internet|rent/.test(lower)) {
      return { item: q, category: billCat, type: 'expense', count: 0, isKeywordRule: true };
    }
    if (/น้ำมัน|ค่ารถ|เดินทาง|ทางด่วน|แท็กซี่|วิน|ส่งของ|ขนส่ง|จอดรถ|fuel|gas|taxi|grab/.test(lower)) {
      return { item: q, category: transCat, type: 'expense', count: 0, isKeywordRule: true };
    }
    if (/ถุง|แก้ว|หลอด|ทิชชู่|กล่อง|แพ็คเกจ|อุปกรณ์|ซื้อของ|ช้อปปิ้ง/.test(lower)) {
      return { item: q, category: shopCat, type: 'expense', count: 0, isKeywordRule: true };
    }
    if (/ขาย|ออร์เดอร์|ยอดขาย|หน้าร้าน|รายรับ|รายได้|order|sales/.test(lower)) {
      return { item: q, category: orderCat, type: 'income', count: 0, isKeywordRule: true };
    }

    return {
      item: q,
      category: isIncome ? (incomeCategories[0] || 'order') : (expenseCategories[0] || 'Food & Dining'),
      type,
      count: 0,
      isKeywordRule: true,
    };
  };

  // Filtered search results when typing in Quick-Search
  const searchResults = useMemo(() => {
    const q = quickSearch.trim().toLowerCase();
    if (!q) return [];

    const matches = smartCatalog.filter(
      (entry) =>
        entry.item.toLowerCase().includes(q) ||
        entry.category.toLowerCase().includes(q) ||
        (t[entry.category as keyof typeof t] || '').toLowerCase().includes(q)
    );

    const exactExists = matches.some((m) => m.item.toLowerCase() === q);
    if (!exactExists) {
      const inferred = inferKeywordSuggestion(quickSearch);
      if (inferred) {
        return [...matches.slice(0, 6), inferred];
      }
    }

    return matches.slice(0, 7);
  }, [quickSearch, smartCatalog, t, expenseCategories, incomeCategories, isIncome, type]);

  // Description / Item selection states
  const descriptionsList = activeMap[category] || [];
  const [isCustomMode, setIsCustomMode] = useState(true);

  const getCategoryDisplayName = (cat: string) => {
    if (cat === 'order') return language === 'en' ? 'Order' : 'รายรับ (ออร์เดอร์)';
    return (t[cat as keyof typeof t] as string) || cat;
  };

  // Apply a selected Smart Catalog item -> automatically maps Type, Category, and Description
  const applySmartItem = (entry: SmartCatalogItem) => {
    setType(entry.type);
    setCategory(entry.category);
    setIsCustomCategoryMode(false);

    const targetMap = entry.type === 'income' ? (metaMap.income || {}) : (metaMap.expenses || {});
    const listForCat = targetMap[entry.category] || [];
    const existsInDropdown = listForCat.includes(entry.item);
    setIsCustomMode(!existsInDropdown);

    form.setFieldsValue({
      type: entry.type,
      category: entry.category,
      item: entry.item,
    });

    setAutoMappedInfo(entry);
    setQuickSearch('');
    setIsSearchFocused(false);
  };

  // Handle manual Type switch (Income <-> Expense)
  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setAutoMappedInfo(null);
    setIsCustomCategoryMode(false);

    const defaultCat =
      newType === 'income'
        ? incomeCategories[0] || 'order'
        : expenseCategories[0] || 'Food & Dining';
    setCategory(defaultCat);
    form.setFieldValue('category', defaultCat);

    const targetMap = newType === 'income' ? (metaMap.income || {}) : (metaMap.expenses || {});
    const list = targetMap[defaultCat] || [];
    if (list.length > 0) {
      form.setFieldValue('item', list[0]);
      setIsCustomMode(false);
    } else {
      form.setFieldValue('item', '');
      setIsCustomMode(true);
    }
  };

  // Handle manual Category switch
  const handleCategoryChange = (newCat: string) => {
    if (newCat === '__custom_category__') {
      setIsCustomCategoryMode(true);
      form.setFieldValue('category', '');
      return;
    }
    setCategory(newCat);
    setAutoMappedInfo(null);
    const list = activeMap[newCat] || [];
    if (list.length > 0) {
      form.setFieldValue('item', list[0]);
      setIsCustomMode(false);
    } else {
      form.setFieldValue('item', '');
      setIsCustomMode(true);
    }
  };

  // Sync default category and form values when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuickSearch('');
      setAutoMappedInfo(null);
      setIsCustomCategoryMode(false);
      const defaultCat = isIncome 
        ? (incomeCategories[0] || 'order') 
        : (expenseCategories[0] || 'Food & Dining');
      setCategory(defaultCat);

      const resolvedDate =
        initialDate && dayjs(initialDate).isValid()
          ? dayjs(initialDate)
          : dayjs();
      
      form.setFieldsValue({
        type,
        amount: undefined,
        category: defaultCat,
        date: resolvedDate,
        item: ''
      });
      
      const list = activeMap[defaultCat] || [];
      if (list.length > 0) {
        form.setFieldValue('item', list[0]);
        setIsCustomMode(false);
      } else {
        setIsCustomMode(true);
      }
    }
  }, [isOpen, initialDate, form, metaMap]);

  const handleSubmit = (values: any) => {
    const amountVal = values.amount;
    if (!amountVal) return;

    let itemVal = (values.item || '').trim();
    if (type === 'income' && !itemVal) {
      itemVal = language === 'en' ? 'Sales Revenue' : 'รายได้การขาย'; // Default for Income
    }

    onAdd({
      item: itemVal,
      type,
      category: values.category,
      amount: amountVal,
      date: values.date.format('YYYY-MM-DD') // Formats as YYYY-MM-DD
    });

    onClose();
  };

  // --- Dynamic Color Shifting tokens (with Dark Mode support) ---
  const localTheme = {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
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
      width={500}
      style={{ maxWidth: 'calc(100vw - 24px)', top: 16 }}
      className="premium-antd-modal"
      title={
        <div>
          <h2 className="text-xl sm:text-2xl font-black !text-slate-900 tracking-tight leading-none">
            {t.newTransaction}
          </h2>
          <p className="text-xs !text-slate-500 font-bold mt-1.5 font-sans">
            {language === 'en' 
              ? 'Record a new inflow or outflow of capital' 
              : 'บันทึกรายการรายรับหรือรายจ่ายทางการเงินของร้านค้า'}
          </p>
        </div>
      }
    >
      <ConfigProvider theme={localTheme}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4 sm:mt-5 space-y-3.5"
        >
          {/* ================= SMART QUICK-SEARCH & AUTO-CATEGORY MAPPER ================= */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-emerald-600 fill-emerald-500" />
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                  {language === 'en' ? 'Smart Quick-Fill & Auto-Category' : 'ค้นหารายการด่วน (จับคู่หมวดหมู่อัตโนมัติ)'}
                </span>
              </div>
              {autoMappedInfo && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-fadeIn">
                  <CheckCircle2 size={11} />
                  <span>{getCategoryDisplayName(autoMappedInfo.category)}</span>
                </span>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
              <input
                type="text"
                value={quickSearch}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 180)}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder={
                  language === 'en'
                    ? 'Search item e.g. Ice, Coffee, Electricity...'
                    : 'พิมพ์ค้นหา เช่น ค่าน้ำแข็ง, ค่ากาแฟ, ค่าไฟ...'
                }
                className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
              {quickSearch && (
                <button
                  type="button"
                  onClick={() => setQuickSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}

              {/* Instant Auto-Map Dropdown Results */}
              {(isSearchFocused || quickSearch.trim().length > 0) && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
                  {searchResults.map((entry, idx) => {
                    const isInc = entry.type === 'income';
                    return (
                      <button
                        key={`${entry.type}-${entry.item}-${idx}`}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent blur before click
                          applySmartItem(entry);
                        }}
                        className="w-full px-3.5 py-2.5 text-left hover:bg-emerald-50/60 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {entry.isKeywordRule && (
                              <Sparkles size={13} className="text-amber-500 shrink-0" />
                            )}
                            <span className="text-xs sm:text-sm font-black text-slate-800 truncate">
                              {entry.item}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                                isInc
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {isInc ? t.income : t.expense}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 truncate">
                              → {getCategoryDisplayName(entry.category)}
                            </span>
                          </div>
                        </div>

                        {entry.lastAmount !== undefined && (
                          <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-lg shrink-0 font-sans">
                            ฿{entry.lastAmount.toLocaleString()}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 1-Tap Frequent Items Chips when not typing */}
            {!quickSearch && topFrequentItems.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-2 pt-0.5">
                <span className="text-[10px] font-extrabold text-slate-400 shrink-0">
                  {language === 'en' ? 'Frequent:' : 'ใช้บ่อย:'}
                </span>
                {topFrequentItems.map((entry, idx) => (
                  <button
                    key={`freq-${idx}`}
                    type="button"
                    onClick={() => applySmartItem(entry)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white border border-slate-200/80 text-slate-700 hover:border-emerald-400 hover:text-emerald-700 transition-all shrink-0 cursor-pointer active:scale-95"
                  >
                    {entry.item}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Income vs Expense sliding segmented controller */}
          <Form.Item name="type" className="mb-3 animate-fadeIn">
            <Segmented
              block
              size="large"
              options={[
                { label: t.income, value: 'income' },
                { label: t.expense, value: 'expense' }
              ]}
              onChange={(val) => {
                handleTypeChange(val as 'income' | 'expense');
              }}
            />
          </Form.Item>

          {/* Amount input (Full Row Width) */}
          <Form.Item
            name="amount"
            label={
              <div className="flex items-center justify-between w-full">
                <span className="font-extrabold !text-slate-700 uppercase tracking-wider text-[11px]">
                  {t.formAmount} (฿)
                </span>
                {autoMappedInfo?.lastAmount !== undefined && (
                  <button
                    type="button"
                    onClick={() => form.setFieldValue('amount', autoMappedInfo.lastAmount)}
                    className="text-[10px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                  >
                    {language === 'en'
                      ? `Use last price ฿${autoMappedInfo.lastAmount.toLocaleString()}`
                      : `ใช้ราคาล่าสุด ฿${autoMappedInfo.lastAmount.toLocaleString()}`}
                  </button>
                )}
              </div>
            }
            rules={[{ required: true, message: language === 'en' ? 'Please enter a valid amount' : 'กรุณากรอกจำนวนเงินที่ถูกต้อง' }]}
          >
            <InputNumber
              className="w-full font-bold !text-slate-900"
              size="large"
              placeholder="0.00"
              min={0.01}
              precision={2}
              inputMode="decimal"
              style={{ width: '100%', height: '46px', display: 'flex', alignItems: 'center' }}
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
                  onChange={handleCategoryChange}
                  options={[
                    ...(isIncome ? incomeCategories : expenseCategories).map(cat => ({
                      label: getCategoryDisplayName(cat),
                      value: cat
                    })),
                    {
                      label: language === 'en' ? '+ Add custom category...' : '+ เพิ่มหมวดหมู่ใหม่...',
                      value: '__custom_category__'
                    }
                  ]}
                  style={{ width: '100%', height: '46px' }}
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
                style={{ width: '100%', height: '46px' }}
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
                style={{ width: '100%', height: '46px' }}
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
              className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-extrabold text-white transition-all text-sm cursor-pointer ${submitButtonClass}`}
            >
              {t.addTransactionBtn}
            </button>
          </div>
        </Form>
      </ConfigProvider>
    </Modal>
  );
};

export default AddTransactionModal;
export type { AddTransactionModalProps };

