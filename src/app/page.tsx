'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import AuthPage from '@/features/auth/AuthPage';
import FinanceDashboard from '@/features/dashboard/FinanceDashboard';
import { Spin } from 'antd';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Spin size="large" description="Initializing POS Workstation..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <FinanceDashboard />;
}
