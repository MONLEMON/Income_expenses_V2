'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Card, ConfigProvider, App } from 'antd';
import { UserOutlined, LockOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useTranslation } from '@/hooks/useLanguageStore';

const AuthPage: React.FC = () => {
  const { message } = App.useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const loginStore = useAuthStore((state) => state.login);
  const { language } = useTranslation();
  const [form] = Form.useForm();

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      if (isLogin) {
        // --- LOGIN FLOW ---
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: values.username,
            password: values.password,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Authentication failed');
        }

        loginStore(data.user, data.token);
        message.success(
          language === 'en'
            ? `Welcome back, ${data.user.fullName}!`
            : `ยินดีต้อนรับกลับมา, คุณ${data.user.fullName}!`
        );
      } else {
        // --- REGISTER FLOW ---
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: values.username,
            password: values.password,
            fullName: values.fullName,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Registration failed');
        }

        message.success(
          language === 'en'
            ? 'Account created successfully! Please log in.'
            : 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ'
        );
        setIsLogin(true);
        form.resetFields();
      }
    } catch (err: any) {
      message.error(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const appTheme = {
    token: {
      colorPrimary: '#10b981', // Emerald Green
      borderRadius: 16,
    },
  };

  return (
    <ConfigProvider theme={appTheme}>
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
        
        {/* Modern background blur shapes for ambient lighting effect */}
        <div className="absolute w-[400px] h-[400px] rounded-full bg-emerald-300/30 blur-[100px] -top-20 -left-20 animate-pulse duration-5000"></div>
        <div className="absolute w-[350px] h-[350px] rounded-full bg-emerald-500/10 blur-[80px] -bottom-20 -right-20 animate-pulse duration-7000"></div>

        <div className="w-full max-w-md px-6 z-10">
          {/* Logo brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-700 to-emerald-500 rounded-2xl flex items-center justify-center text-white font-extrabold text-3xl shadow-lg shadow-emerald-200 mb-3 transform hover:rotate-3 transition-transform">
              F
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">
              {language === 'en' ? 'POS Financials' : 'ระบบการเงิน POS'}
            </h1>
            <p className="text-xs text-slate-500 font-bold mt-2 font-sans tracking-wide">
              {language === 'en' ? 'MINT & EMERALD PREMIUM EDITION' : 'เวอร์ชันพรีเมียมสีมินต์และมรกต'}
            </p>
          </div>

          <Card className="shadow-xl shadow-slate-100 border border-slate-100/80 bg-white/90 backdrop-blur-md rounded-3xl p-3">
            <div className="text-center mb-6">
              <h2 className="text-xl font-extrabold text-slate-800">
                {isLogin
                  ? (language === 'en' ? 'Log In' : 'เข้าสู่ระบบ')
                  : (language === 'en' ? 'Register Account' : 'สมัครสมาชิก')}
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                {isLogin
                  ? (language === 'en' ? 'Enter credentials to access your terminal' : 'กรอกข้อมูลส่วนตัวเพื่อเข้าใช้งาน')
                  : (language === 'en' ? 'Create a private, isolated workspace' : 'สร้างบัญชีส่วนตัวใหม่สำหรับเก็บข้อมูลแยก')}
              </p>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleFinish}
              className="space-y-4 font-sans"
            >
              {!isLogin && (
                <Form.Item
                  name="fullName"
                  label={<span className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Full Name</span>}
                  rules={[{ required: true, message: 'Please enter your name' }]}
                >
                  <Input 
                    placeholder={language === 'en' ? 'e.g. John Doe' : 'เช่น สมชาย ตั้งใจ'} 
                    size="large"
                    className="font-bold text-slate-800 rounded-xl"
                  />
                </Form.Item>
              )}

              <Form.Item
                name="username"
                label={<span className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Username</span>}
                rules={[{ required: true, message: 'Username is required' }]}
              >
                <Input 
                  prefix={<UserOutlined className="text-slate-400" />}
                  placeholder={language === 'en' ? 'Enter username' : 'กรอกชื่อผู้ใช้'} 
                  size="large"
                  className="font-bold text-slate-800 rounded-xl"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<span className="font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">Password</span>}
                rules={[{ required: true, message: 'Password is required' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined className="text-slate-400" />}
                  placeholder={language === 'en' ? 'Enter password' : 'กรอกรหัสผ่าน'} 
                  size="large"
                  className="font-bold text-slate-800 rounded-xl"
                />
              </Form.Item>

              <Form.Item className="pt-2 mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  className="font-black text-sm bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.01] active:scale-[0.99] transition-all py-6 flex items-center justify-center rounded-xl cursor-pointer shadow-md shadow-emerald-100 animate-fadeIn"
                >
                  {isLogin
                    ? (language === 'en' ? 'LOG IN' : 'เข้าสู่ระบบ')
                    : (language === 'en' ? 'REGISTER NOW' : 'สมัครสมาชิกทันที')}
                </Button>
              </Form.Item>
            </Form>

            <div className="text-center mt-6 pt-4 border-t border-slate-50">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  form.resetFields();
                }}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                {isLogin
                  ? (language === 'en' ? "Don't have an account? Register" : 'ยังไม่มีบัญชีใช่หรือไม่? สมัครสมาชิก')
                  : (language === 'en' ? 'Already have an account? Log In' : 'มีบัญชีอยู่แล้วใช่หรือไม่? เข้าสู่ระบบ')}
              </button>
            </div>
          </Card>

          {/* Bilingual seeding information block */}
          <div className="mt-6 bg-emerald-50/50 border border-emerald-100/60 p-4 rounded-2xl flex gap-3 items-start animate-fadeIn">
            <InfoCircleOutlined className="text-emerald-700 text-base mt-0.5 shrink-0" />
            <div className="text-[11px] leading-relaxed text-emerald-800 font-semibold font-sans">
              {language === 'en' ? (
                <p>
                  To review pre-existing transaction orders, filter states, and reports, log in with username: <strong className="text-emerald-950 font-bold bg-emerald-100/60 px-1.5 py-0.5 rounded">demo</strong> and password: <strong className="text-emerald-950 font-bold bg-emerald-100/60 px-1.5 py-0.5 rounded">demo123</strong>. Or create a brand new account to test isolated blank workspaces!
                </p>
              ) : (
                <p>
                  เพื่อดูข้อมูลธุรกรรม แผนภูมิรายงาน และดึงประวัติที่มีอยู่เดิม ให้ใช้ชื่อผู้ใช้: <strong className="text-emerald-950 font-bold bg-emerald-100/60 px-1.5 py-0.5 rounded">demo</strong> และรหัสผ่าน: <strong className="text-emerald-950 font-bold bg-emerald-100/60 px-1.5 py-0.5 rounded">demo123</strong> หรือสมัครบัญชีใหม่เพื่อทดสอบการแยกข้อมูลส่วนบุคคลได้ทันที!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default AuthPage;
