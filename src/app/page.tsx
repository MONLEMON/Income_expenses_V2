'use client';

import { useEffect, useState } from 'react';
import { useAuthStore, isTokenExpired } from '@/hooks/useAuthStore';
import AuthPage from '@/features/auth/AuthPage';
import FinanceDashboard from '@/features/dashboard/FinanceDashboard';
import { Spin } from 'antd';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const checkAuthValidity = useAuthStore((state) => state.checkAuthValidity);

  useEffect(() => {
    checkAuthValidity();
    setMounted(true);
  }, [checkAuthValidity]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Spin size="large" description="Initializing POS Workstation..." />
      </div>
    );
  }

  if (!isAuthenticated || !token || isTokenExpired(token)) {
    return <AuthPage />;
  }

  return <FinanceDashboard />;
}
