'use client';

import React from 'react';
import { Table, Tag, Progress, Button, Dropdown } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { MoreHorizontal } from 'lucide-react';
import { useTranslation } from '@/hooks/useLanguageStore';
import type { Transaction } from '@/hooks/useTransactions';

interface TransactionsTableProps {
  transactions: Transaction[];
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions }) => {
  const { language, t } = useTranslation();
  
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
      render: () => (
        <Dropdown
          menu={{
            items: [
              { key: 'edit', label: language === 'en' ? 'Edit record' : 'แก้ไขรายการ' },
              { key: 'delete', label: language === 'en' ? 'Delete record' : 'ลบรายการ', danger: true }
            ]
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-emerald-50/10 transition-all duration-300">
      <div className="p-6 md:p-8 flex justify-between items-center border-b border-gray-50">
        <div>
          <h2 className="text-xl font-extrabold !text-black drop-shadow-sm">{t.recentTransactions}</h2>
          <p className="text-sm text-gray-700 mt-1 font-medium">
            {language === 'en' ? 'Your recent financial activity' : 'ประวัติการทำรายการทางการเงินล่าสุดของคุณ'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            type="primary" 
            ghost
            className="border-emerald-200 text-emerald-600 hover:text-emerald-700 hover:border-emerald-300 font-bold rounded-xl cursor-pointer"
            size="middle"
          >
            {language === 'en' ? 'View All' : 'ดูทั้งหมด'}
          </Button>
        </div>
      </div>
      
      <div className="px-4 pb-4">
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
    </div>
  );
};

export default TransactionsTable;
export type { Transaction };
