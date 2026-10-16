'use client';

import React, { useState } from 'react';
import { Search, Bell, ChevronDown, Plus, KeyRound, LogOut, Lock, Moon, Sun } from 'lucide-react';
import { useTranslation } from '@/hooks/useLanguageStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useThemeStore } from '@/hooks/useThemeStore';
import { fetchWithAuth } from '@/lib/apiClient';
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
  const themeMode = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      key: 'user-info',
      label: (
        <div className="py-1 px-0.5">
          <p className="text-xs font-black text-slate-800 leading-tight">{user?.fullName || 'POS User'}</p>
          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">{t.premiumUser}</p>
        </div>
      ),
      disabled: true,
      style: { cursor: 'default', opacity: 1 }
    },
    {
      type: 'divider'
    },
    {
      key: 'toggle-theme',
      label: themeMode === 'dark'
        ? (language === 'en' ? 'Switch to Light Mode' : 'โหมดสว่าง (Light Mode)')
        : (language === 'en' ? 'Switch to Dark Mode' : 'โหมดมืด (Dark Mode)'),
      icon: themeMode === 'dark' ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />,
      onClick: toggleTheme
    },
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
    <header className="mb-4 md:mb-8 animate-fadeIn print:hidden">
      {/* Top App Bar Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Mobile Brand Badge */}
          <div className="md:hidden w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-500 flex items-center justify-center text-white font-black text-lg shadow-sm shadow-emerald-200 shrink-0 select-none">
            F
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight truncate">
              {title || t.dashboard}
            </h1>
            <p className="text-[11px] md:text-sm text-slate-500 font-medium line-clamp-1 mt-0.5">
              {subTitle || t.welcomeSubtitle}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="h-9 w-9 md:h-10 md:w-10 bg-white border border-slate-200/80 rounded-xl text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-all flex items-center justify-center shadow-sm cursor-pointer select-none active:scale-95"
            title={themeMode === 'dark' ? (language === 'en' ? 'Light Mode' : 'โหมดสว่าง') : (language === 'en' ? 'Dark Mode' : 'โหมดมืด')}
          >
            {themeMode === 'dark' ? (
              <Sun size={17} className="text-amber-400" />
            ) : (
              <Moon size={17} className="text-slate-600" />
            )}
          </button>

          {/* Language Selection Button */}
          <button 
            onClick={() => setLanguage(language === 'en' ? 'th' : 'en')}
            className="h-9 px-2.5 md:h-10 md:px-3.5 bg-white border border-slate-200/80 rounded-xl text-slate-700 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all flex items-center gap-1.5 shadow-sm font-black text-xs cursor-pointer select-none active:scale-95"
            title={language === 'en' ? 'Switch to Thai' : 'เปลี่ยนเป็นภาษาอังกฤษ'}
          >
            <span className="text-xs leading-none">{language === 'en' ? '🇺🇸' : '🇹🇭'}</span>
            <span className="font-extrabold">{language === 'en' ? 'EN' : 'TH'}</span>
          </button>

          {/* Desktop & Mobile Quick New Transaction Button */}
          <button 
            onClick={onAddTransaction}
            className="flex bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-extrabold h-9 px-3 md:h-10 md:px-4 rounded-xl text-xs md:text-sm shadow-md shadow-emerald-100 hover:shadow-lg hover:shadow-emerald-200 hover:scale-[1.02] active:scale-[0.96] transition-all items-center gap-1.5 cursor-pointer border-none"
          >
            <Plus size={16} className="md:w-[18px] md:h-[18px]" strokeWidth={2.5} />
            <span className="hidden sm:inline">{t.newTransaction}</span>
            <span className="sm:hidden">{language === 'en' ? 'New' : 'เพิ่ม'}</span>
          </button>

          {/* Notification Bell (Hidden on very small screens to save space, shown from sm up) */}
          <button className="hidden sm:flex h-9 w-9 md:h-10 md:w-10 items-center justify-center bg-white border border-slate-200/80 rounded-xl text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all relative shadow-sm cursor-pointer active:scale-95">
            <Bell size={18} className="md:w-5 md:h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
          </button>

          {/* User Profile with Action Dropdown */}
          <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
            <div className="flex items-center space-x-2 md:pl-3 md:border-l border-slate-200 cursor-pointer group select-none active:scale-95 transition-transform">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl md:rounded-full overflow-hidden border-2 border-white shadow-sm group-hover:border-emerald-500 transition-all">
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'POS User')}&background=059669&color=fff&bold=true`} 
                  alt="User" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-700 group-hover:text-emerald-600 transition-colors leading-tight">
                  {user?.fullName || 'POS User'}
                </p>
                <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">{t.premiumUser}</p>
              </div>
              <ChevronDown size={14} className="text-slate-400 group-hover:text-emerald-600 transition-colors hidden sm:block" />
            </div>
          </Dropdown>
        </div>
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
        style={{ maxWidth: 'calc(100vw - 20px)', top: 20 }}
        className="premium-antd-modal"
        title={
          <div>
            <h2 className="text-xl sm:text-2xl font-black !text-slate-900 tracking-tight leading-none">
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
            className="mt-5 sm:mt-6 space-y-4"
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
            <div className="pt-4 flex justify-end gap-2.5 sm:gap-3 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsChangePasswordOpen(false);
                  form.resetFields();
                }}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold !text-slate-600 hover:bg-slate-100 transition-colors text-sm border border-slate-200 hover:border-slate-300 cursor-pointer"
              >
                {language === 'en' ? 'Cancel' : 'ยกเลิก'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all text-sm cursor-pointer shadow-sm hover:shadow-md disabled:opacity-50"
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
