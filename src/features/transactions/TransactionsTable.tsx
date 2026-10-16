'use client';

import React, { useState, useMemo } from 'react';
import { Table, Tag, Progress, Button, Dropdown, Modal, Input, App } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { MoreHorizontal, Search, Trash2, Edit3, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/useLanguageStore';
import type { Transaction } from '@/hooks/useTransactions';
import { useUpdateTransaction, useDeleteTransaction } from '@/hooks/useTransactions';
import EditTransactionModal from './EditTransactionModal';

interface TransactionsTableProps {
  transactions: Transaction[];
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions }) => {
  const { language, t } = useTranslation();
  const { message } = App.useApp();
  
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [ledgerSearch, setLedgerSearch] = useState('');

  const updateTxMutation = useUpdateTransaction();
  const deleteTxMutation = useDeleteTransaction();

  const handleActionClick = (key: string, record: Transaction) => {
    if (key === 'edit') {
      setSelectedTx(record);
      setIsEditOpen(true);
    } else if (key === 'delete') {
      Modal.confirm({
        title: language === 'en' ? 'Confirm Deletion' : 'ยืนยันการลบรายการ',
        icon: <AlertTriangle className="text-rose-500 mr-2 shrink-0" size={22} />,
        content: language === 'en' 
          ? `Are you sure you want to delete "${record.item}"? This action cannot be undone.` 
          : `คุณแน่ใจหรือไม่ที่จะลบรายการ "${record.item}"? การดำเนินการนี้ไม่สามารถยกเลิกได้ในภายหลัง`,
        okText: language === 'en' ? 'Delete' : 'ลบออก',
        okType: 'danger',
        cancelText: language === 'en' ? 'Cancel' : 'ยกเลิก',
        onOk: async () => {
          try {
            await deleteTxMutation.mutateAsync(record.id);
            message.success(language === 'en' ? 'Transaction deleted successfully!' : 'ลบรายการเรียบร้อยแล้ว!');
          } catch (err: any) {
            message.error(err.message || 'Failed to delete transaction');
          }
        }
      });
    }
  };

  const handleSaveEdit = async (updatedTx: any) => {
    await updateTxMutation.mutateAsync(updatedTx);
  };

  const filteredLedgerTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.item.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
      t.category.toLowerCase().includes(ledgerSearch.toLowerCase())
    );
  }, [transactions, ledgerSearch]);
  
  // Custom columns configuration for Ant Design Table
  const columns: ColumnsType<Transaction> = [
    {
      title: language === 'en' ? 'Transaction Date' : 'วันที่ทำรายการ',
      dataIndex: 'date',
      key: 'date',
      className: 'font-semibold !text-slate-500 text-sm',
      sorter: (a, b) => {
        // Parse dd/mm/yyyy for precise date sorting
        const [aD, aM, aY] = a.date.split('/').map(Number);
        const [bD, bM, bY] = b.date.split('/').map(Number);
        return new Date(aY, aM - 1, aD).getTime() - new Date(bY, bM - 1, bD).getTime();
      },
    },
    {
      title: language === 'en' ? 'Item Name' : 'รายการ / คำอธิบาย',
      dataIndex: 'item',
      key: 'item',
      className: 'font-bold !text-slate-800 text-sm hover:!text-emerald-700 transition-colors',
      render: (text) => <span>{text}</span>,
    },
    {
      title: t.type,
      dataIndex: 'type',
      key: 'type',
      responsive: ['md'] as any,
      className: 'text-sm font-semibold !text-slate-500',
      filters: [
        { text: t.income, value: 'Income' },
        { text: t.expense, value: 'Expense' },
      ],
      onFilter: (value, record) => record.type === value,
      render: (type) => (
        <span className={type === 'Income' ? 'text-emerald-600 font-bold' : 'text-rose-500 font-medium'}>
          {type === 'Income' ? t.income : t.expense}
        </span>
      )
    },
    {
      title: t.category,
      dataIndex: 'category',
      key: 'category',
      render: (_, record) => {
        const isIncome = record.type === 'Income';
        const displayCat = record.category === 'order'
          ? (language === 'en' ? 'Order' : 'รายรับ (ออร์เดอร์)')
          : (t[record.category as keyof typeof t] || record.category);

        return (
          <Tag 
            className={`px-3 py-1 font-bold text-xs uppercase tracking-wider rounded-lg border-none ${
              isIncome 
                ? 'bg-emerald-50 text-emerald-700' 
                : 'bg-slate-50 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5 animate-fadeIn">
              <div className={`w-2 h-2 rounded-full ${record.color}`}></div>
              <span>{displayCat}</span>
            </div>
          </Tag>
        );
      }
    },
    {
      title: t.amount,
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      className: 'text-sm',
      sorter: (a, b) => a.amount - b.amount,
      render: (amount: number) => {
        const isPos = amount > 0;
        return (
          <span className={`font-extrabold ${isPos ? 'text-emerald-600' : 'text-rose-500'}`}>
            {isPos ? '+' : ''}฿{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      }
    },
    {
      title: t.contribution,
      dataIndex: 'contribution',
      key: 'contribution',
      responsive: ['md'] as any,
      align: 'center',
      render: (contribution: string, record) => {
        const percent = parseFloat(contribution.replace('%', '')) || 0;
        const color = record.amount > 0 ? '#10b981' : '#f43f5e'; // emerald vs rose
        return (
          <div className="flex flex-col items-center min-w-[120px]">
            <span className="text-[10px] text-gray-400 font-bold mb-1">{contribution}</span>
            <Progress 
              percent={percent} 
              showInfo={false} 
              strokeColor={color} 
              railColor="#f1f5f9"
              size={['100%', 6]}
            />
          </div>
        );
      }
    },
    {
      title: '',
      key: 'action',
      align: 'right',
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              { key: 'edit', label: language === 'en' ? 'Edit record' : 'แก้ไขรายการ', icon: <Edit3 size={14} /> },
              { key: 'delete', label: language === 'en' ? 'Delete record' : 'ลบรายการ', danger: true, icon: <Trash2 size={14} /> }
            ],
            onClick: ({ key }) => handleActionClick(key, record)
          }}
          trigger={['click']}
        >
          <Button 
            type="text" 
            shape="circle" 
            icon={<MoreHorizontal size={18} className="text-gray-400" />} 
            className="cursor-pointer"
          />
        </Dropdown>
      )
    }
  ];

  // Mobile state filters
  const [mobileTypeFilter, setMobileTypeFilter] = useState<'ALL' | 'Income' | 'Expense'>('ALL');
  const [mobileSearch, setMobileSearch] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<'ALL' | 'Income' | 'Expense'>('ALL');
  const [mobilePage, setMobilePage] = useState(1);
  const mobilePageSize = 6;

  const mobileFilteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = mobileTypeFilter === 'ALL' || t.type === mobileTypeFilter;
      const matchesSearch = !mobileSearch.trim() ||
        t.item.toLowerCase().includes(mobileSearch.toLowerCase()) ||
        t.category.toLowerCase().includes(mobileSearch.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [transactions, mobileTypeFilter, mobileSearch]);

  const filteredLedgerByType = useMemo(() => {
    return filteredLedgerTransactions.filter(t => 
      ledgerTypeFilter === 'ALL' ? true : t.type === ledgerTypeFilter
    );
  }, [filteredLedgerTransactions, ledgerTypeFilter]);

  const paginatedMobileTransactions = useMemo(() => {
    const start = (mobilePage - 1) * mobilePageSize;
    return mobileFilteredTransactions.slice(start, start + mobilePageSize);
  }, [mobileFilteredTransactions, mobilePage, mobilePageSize]);

  const totalMobilePages = Math.ceil(mobileFilteredTransactions.length / mobilePageSize) || 1;

  return (
    <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg hover:shadow-emerald-50/10 transition-all duration-300">
      {/* Header Bar */}
      <div className="p-4 sm:p-6 md:p-8 flex items-center justify-between gap-3 border-b border-slate-50">
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight truncate">{t.recentTransactions}</h2>
          <p className="text-[11px] sm:text-sm text-slate-500 font-medium mt-0.5 truncate">
            {language === 'en' ? 'Your recent financial activity' : 'ประวัติการทำรายการทางการเงินล่าสุดของคุณ'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            type="primary" 
            ghost
            onClick={() => setIsLedgerOpen(true)}
            className="border-emerald-200 text-emerald-700 hover:text-emerald-800 hover:border-emerald-300 font-extrabold rounded-xl cursor-pointer text-xs sm:text-sm h-9 px-3.5 sm:px-4"
          >
            {language === 'en' ? 'View All' : 'ดูทั้งหมด'}
          </Button>
        </div>
      </div>
      
      {/* ================= DESKTOP TABLE VIEW ================= */}
      <div className="hidden md:block px-4 pb-4">
        <Table 
          columns={columns} 
          dataSource={transactions} 
          rowKey="id"
          pagination={{
            pageSize: 6,
            showSizeChanger: false,
            className: 'premium-table-pagination font-bold'
          }}
          className="premium-antd-table text-slate-800"
        />
      </div>

      {/* ================= MOBILE TRANSACTION FEED (CARD LIST) ================= */}
      <div className="block md:hidden p-3 sm:p-4">
        {/* Mobile Quick Search Input */}
        <div className="relative mb-2.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            value={mobileSearch}
            onChange={(e) => {
              setMobileSearch(e.target.value);
              setMobilePage(1);
            }}
            placeholder={language === 'en' ? 'Search transactions...' : 'ค้นหารายการ หรือหมวดหมู่...'}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 outline-none transition-all"
          />
        </div>

        {/* Mobile Type Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl mb-3">
          {(['ALL', 'Income', 'Expense'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => {
                setMobileTypeFilter(filterType);
                setMobilePage(1);
              }}
              className={`flex-1 py-1.5 text-center text-xs font-black rounded-lg transition-all cursor-pointer select-none ${
                mobileTypeFilter === filterType
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {filterType === 'ALL'
                ? (language === 'en' ? 'All' : 'ทั้งหมด')
                : filterType === 'Income'
                  ? (language === 'en' ? 'Income' : 'รายรับ')
                  : (language === 'en' ? 'Expense' : 'รายจ่าย')}
            </button>
          ))}
        </div>

        {/* Transaction Cards List */}
        {paginatedMobileTransactions.length === 0 ? (
          <div className="text-center py-10 text-slate-400 font-bold text-xs">
            {language === 'en' ? 'No transactions found' : 'ไม่พบรายการธุรกรรม'}
          </div>
        ) : (
          <div className="space-y-2.5">
            {paginatedMobileTransactions.map((tx) => {
              const isIncome = tx.type === 'Income';
              const displayCat = tx.category === 'order'
                ? (language === 'en' ? 'Order' : 'รายรับ (ออร์เดอร์)')
                : (t[tx.category as keyof typeof t] || tx.category);

              return (
                <div
                  key={tx.id}
                  className="p-3 sm:p-3.5 bg-slate-50/70 hover:bg-emerald-50/20 border border-slate-100 rounded-2xl flex items-center justify-between gap-2.5 transition-all active:scale-[0.99]"
                >
                  {/* Category Circle Indicator */}
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs ${
                      isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      <div className={`w-3 h-3 rounded-full ${tx.color}`} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 truncate leading-snug">
                        {tx.item}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200/60 text-slate-600 truncate max-w-[115px]">
                          {displayCat}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                          {tx.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="text-right">
                      <p className={`text-xs sm:text-sm font-black tracking-tight ${
                        isIncome ? 'text-emerald-600' : 'text-rose-500'
                      }`}>
                        {isIncome ? '+' : '-'}฿{Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[9px] text-slate-400 font-extrabold mt-0.5">
                        {tx.contribution}
                      </p>
                    </div>

                    <Dropdown
                      menu={{
                        items: [
                          { key: 'edit', label: language === 'en' ? 'Edit record' : 'แก้ไขรายการ', icon: <Edit3 size={14} /> },
                          { key: 'delete', label: language === 'en' ? 'Delete record' : 'ลบรายการ', danger: true, icon: <Trash2 size={14} /> }
                        ],
                        onClick: ({ key }) => handleActionClick(key, tx)
                      }}
                      trigger={['click']}
                      placement="bottomRight"
                    >
                      <Button 
                        type="text" 
                        shape="circle" 
                        icon={<MoreHorizontal size={18} className="text-slate-400" />} 
                        className="cursor-pointer -mr-1 !w-8 !h-8 flex items-center justify-center"
                      />
                    </Dropdown>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile Pagination Controls */}
        {totalMobilePages > 1 && (
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs font-bold text-slate-600">
            <button
              disabled={mobilePage <= 1}
              onClick={() => setMobilePage((p) => Math.max(1, p - 1))}
              className="px-3.5 py-2 rounded-xl border border-slate-200 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 active:scale-95 transition-transform"
            >
              {language === 'en' ? 'Previous' : 'ก่อนหน้า'}
            </button>
            <span className="text-[11px] font-black text-slate-500">
              {mobilePage} / {totalMobilePages}
            </span>
            <button
              disabled={mobilePage >= totalMobilePages}
              onClick={() => setMobilePage((p) => Math.min(totalMobilePages, p + 1))}
              className="px-3.5 py-2 rounded-xl border border-slate-200 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 active:scale-95 transition-transform"
            >
              {language === 'en' ? 'Next' : 'ถัดไป'}
            </button>
          </div>
        )}
      </div>

      {/* Ledger View All Modal */}
      <Modal
        open={isLedgerOpen}
        onCancel={() => {
          setIsLedgerOpen(false);
          setLedgerSearch('');
          setLedgerTypeFilter('ALL');
        }}
        footer={null}
        width={1000}
        style={{ maxWidth: 'calc(100vw - 20px)', top: 16 }}
        className="premium-antd-modal"
        title={
          <div>
            <h2 className="text-lg sm:text-2xl font-black !text-slate-900 tracking-tight leading-none">
              {language === 'en' ? 'Detailed Transaction Ledger' : 'สมุดบัญชีรายวันแบบละเอียด'}
            </h2>
            <p className="text-[11px] sm:text-xs !text-slate-500 font-bold mt-1.5 font-sans">
              {language === 'en' 
                ? 'Full historical ledger records, search, filter, and modify transactions' 
                : 'ข้อมูลประวัติรายการเดินบัญชีทั้งหมด ค้นหา กรอง และแก้ไขหรือลบรายการ'}
            </p>
          </div>
        }
      >
        <div className="mt-4 sm:mt-6 space-y-3.5 sm:space-y-4">
          {/* Search & Type Filter inside Ledger */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative group flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={16} />
              <Input 
                placeholder={language === 'en' ? 'Search by description or category...' : 'ค้นหาด้วยคำอธิบายหรือหมวดหมู่...'}
                value={ledgerSearch}
                onChange={(e) => setLedgerSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                style={{ height: '42px' }}
              />
            </div>

            {/* Type filter pills for mobile ledger */}
            <div className="flex md:hidden items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
              {(['ALL', 'Income', 'Expense'] as const).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setLedgerTypeFilter(filterType)}
                  className={`flex-1 py-1.5 px-3 text-center text-xs font-black rounded-lg transition-all cursor-pointer ${
                    ledgerTypeFilter === filterType
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {filterType === 'ALL'
                    ? (language === 'en' ? 'All' : 'ทั้งหมด')
                    : filterType === 'Income'
                      ? (language === 'en' ? 'Income' : 'รายรับ')
                      : (language === 'en' ? 'Expense' : 'รายจ่าย')}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Ledger Table */}
          <div className="hidden md:block border border-slate-100 rounded-2xl overflow-hidden mt-4">
            <Table 
              columns={columns} 
              dataSource={filteredLedgerTransactions} 
              rowKey="id"
              scroll={{ x: 600 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                className: 'premium-table-pagination font-bold px-4'
              }}
              className="premium-antd-table text-slate-800"
            />
          </div>

          {/* Mobile Ledger Scrollable Card List */}
          <div className="md:hidden max-h-[62vh] overflow-y-auto space-y-2.5 pr-0.5">
            {filteredLedgerByType.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold text-xs border border-dashed border-slate-200 rounded-2xl">
                {language === 'en' ? 'No matching transactions found' : 'ไม่พบรายการที่ค้นหา'}
              </div>
            ) : (
              filteredLedgerByType.map((tx) => {
                const isIncome = tx.type === 'Income';
                const displayCat = tx.category === 'order'
                  ? (language === 'en' ? 'Order' : 'รายรับ (ออร์เดอร์)')
                  : (t[tx.category as keyof typeof t] || tx.category);

                return (
                  <div
                    key={tx.id}
                    className="p-3 bg-slate-50/80 border border-slate-100 rounded-2xl flex items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 truncate">{tx.item}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200/60 text-slate-600 truncate max-w-[110px]">
                          {displayCat}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold shrink-0">{tx.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-xs font-black ${isIncome ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {isIncome ? '+' : '-'}฿{Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleActionClick('edit', tx)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title={language === 'en' ? 'Edit' : 'แก้ไข'}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleActionClick('delete', tx)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title={language === 'en' ? 'Delete' : 'ลบ'}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Transaction Modal */}
      <EditTransactionModal 
        isOpen={isEditOpen} 
        onClose={() => {
          setIsEditOpen(false);
          setSelectedTx(null);
        }}
        transaction={selectedTx}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default TransactionsTable;
export type { Transaction };
