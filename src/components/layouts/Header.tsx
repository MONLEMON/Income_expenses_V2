'use client';

import React, { useState } from 'react';
import { Search, Bell, ChevronDown, Plus, KeyRound, LogOut, Lock } from 'lucide-react';
import { useTranslation } from '@/hooks/useLanguageStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Dropdown, Modal, Form, Input, ConfigProvider, App } from 'antd';
import type { MenuProps } from 'antd';

interface HeaderProps {
  onAddTransaction: () => void;
  title?: string;
  subTitle?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  onAddTransaction,
  title,
  subTitle
}) => {
  const { message } = App.useApp();
  const { language, setLanguage, t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (values: any) => {
    setLoading(true);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          oldPassword: values.oldPassword,
          newPassword: values.newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (language === 'en' ? 'Failed to change password' : 'เปลี่ยนรหัสผ่านไม่สำเร็จ'));
      }

      message.success(language === 'en' ? 'Password changed successfully!' : 'เปลี่ยนรหัสผ่านเสร็จสมบูรณ์แล้ว!');
      setIsChangePasswordOpen(false);
      form.resetFields();
    } catch (err: any) {
      message.error(err.message || (language === 'en' ? 'Error changing password' : 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน'));
    } finally {
      setLoading(false);
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'change-password',
      label: language === 'en' ? 'Change Password' : 'เปลี่ยนรหัสผ่าน',
      icon: <KeyRound size={14} />,
      onClick: () => setIsChangePasswordOpen(true)
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: language === 'en' ? 'Log Out' : 'ออกจากระบบ',
      icon: <LogOut size={14} />,
      danger: true,
      onClick: logout
    }
  ];

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-extrabold !text-black tracking-tight drop-shadow-sm">
          {title || t.dashboard}
        </h1>
        <p className="text-gray-700 text-sm mt-1 font-medium">
          {subTitle || t.welcomeSubtitle}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
        {/* Language Selection Button */}
        <button 
          onClick={() => setLanguage(language === 'en' ? 'th' : 'en')}
          className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all flex items-center gap-2 shadow-sm font-extrabold text-xs cursor-pointer select-none"
          title={language === 'en' ? 'Switch to Thai' : 'เปลี่ยนเป็นภาษาอังกฤษ'}
        >
          <span className="text-sm leading-none">{language === 'en' ? '🇺🇸' : '🇹🇭'}</span>
          <span>{language === 'en' ? 'EN' : 'TH'}</span>
        </button>

        {/* New Transaction Button */}
        <button 
          onClick={onAddTransaction}
          className="bg-emerald-100 text-black border border-emerald-200/60 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-200 hover:shadow-emerald-100/30 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">{t.newTransaction}</span>
        </button>

        {/* Search Bar */}
        <div className="relative group hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder={t.searchItems} 
            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-48 lg:w-64 shadow-sm transition-all outline-none"
          />
        </div>

        {/* Notification Bell */}
        <button className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all relative shadow-sm">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>

        {/* User Profile with Action Dropdown */}
        <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
          <div className="flex items-center space-x-3 pl-2 md:pl-4 md:border-l border-gray-200 cursor-pointer group select-none">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full overflow-hidden border-2 border-white shadow-sm group-hover:shadow-md transition-all">
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'POS User')}&background=059669&color=fff&bold=true`} 
                alt="User" 
              />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-gray-700 group-hover:text-emerald-600 transition-colors leading-tight">
                {user?.fullName || 'POS User'}
              </p>
              <p className="text-[11px] text-gray-500 font-medium">{t.premiumUser}</p>
            </div>
            <ChevronDown size={16} className="text-gray-400 group-hover:text-emerald-600 transition-colors hidden md:block ml-2" />
          </div>
        </Dropdown>
      </div>

      {/* Change Password Modal */}
      <Modal
        open={isChangePasswordOpen}
        onCancel={() => {
          setIsChangePasswordOpen(false);
          form.resetFields();
        }}
        footer={null}
        destroyOnHidden
        forceRender
        width={420}
        className="premium-antd-modal"
        title={
          <div>
            <h2 className="text-2xl font-black !text-slate-900 tracking-tight leading-none">
              {language === 'en' ? 'Change Password' : 'เปลี่ยนรหัสผ่าน'}
            </h2>
            <p className="text-xs !text-slate-500 font-bold mt-1.5 font-sans">
              {language === 'en' 
                ? 'Update your secure POS account password' 
                : 'เปลี่ยนรหัสผ่านเพื่อความปลอดภัยในการเข้าใช้งานระบบ POS ของคุณ'}
            </p>
          </div>
        }
      >
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: '#10b981', // Emerald green brand color
              borderRadius: 16,
              fontFamily: 'Inter, system-ui, sans-serif'
            }
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handlePasswordChange}
            className="mt-6 space-y-4"
          >
            {/* Current Password */}
            <Form.Item
              name="oldPassword"
              label={<span className="font-extrabold !text-slate-700 uppercase tracking-wider text-[11px]">{language === 'en' ? 'Current Password' : 'รหัสผ่านปัจจุบัน'}</span>}
              rules={[{ required: true, message: language === 'en' ? 'Please enter your current password' : 'กรุณากรอกรหัสผ่านปัจจุบัน' }]}
            >
              <Input.Password
                size="large"
                prefix={<Lock size={16} className="text-slate-400 mr-1.5" />}
                placeholder="••••••••"
                style={{ height: '46px' }}
                className="font-sans font-bold"
              />
            </Form.Item>

            {/* New Password */}
            <Form.Item
              name="newPassword"
              label={<span className="font-extrabold !text-slate-700 uppercase tracking-wider text-[11px]">{language === 'en' ? 'New Password' : 'รหัสผ่านใหม่'}</span>}
              rules={[
                { required: true, message: language === 'en' ? 'Please enter your new password' : 'กรุณากรอกรหัสผ่านใหม่' },
                { min: 6, message: language === 'en' ? 'Password must be at least 6 characters' : 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }
              ]}
            >
              <Input.Password
                size="large"
                prefix={<Lock size={16} className="text-slate-400 mr-1.5" />}
                placeholder="••••••••"
                style={{ height: '46px' }}
                className="font-sans font-bold"
              />
            </Form.Item>

            {/* Action buttons */}
            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsChangePasswordOpen(false);
                  form.resetFields();
                }}
                className="px-5 py-2.5 rounded-xl font-bold !text-slate-600 hover:bg-slate-100 transition-colors text-sm border border-slate-200 hover:border-slate-300 cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'ยกเลิก'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all text-sm cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {loading ? (language === 'en' ? 'Updating...' : 'กำลังบันทึก...') : (language === 'en' ? 'Update Password' : 'เปลี่ยนรหัสผ่าน')}
              </button>
            </div>
          </Form>
        </ConfigProvider>
      </Modal>
    </header>
  );
};

export default Header;
