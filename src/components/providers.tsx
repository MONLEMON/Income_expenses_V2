'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ConfigProvider, App, theme as antdTheme } from 'antd';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useThemeStore } from '@/hooks/useThemeStore';
import { ApiError } from '@/lib/apiClient';

export default function Providers({ children }: { children: React.ReactNode }) {
  const themeMode = useThemeStore((state) => state.theme);
  const isDark = themeMode === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const [queryClient] = useState(
    () => {
      const handleAuthError = (error: unknown) => {
        if (
          (error as ApiError)?.status === 401 ||
          (error as Error)?.message?.includes('Unauthorized') ||
          (error as Error)?.message?.includes('Session expired')
        ) {
          useAuthStore.getState().logout();
        }
      };

      return new QueryClient({
        queryCache: new QueryCache({
          onError: handleAuthError,
        }),
        mutationCache: new MutationCache({
          onError: handleAuthError,
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (
                (error as ApiError)?.status === 401 ||
                (error as Error)?.message?.includes('Unauthorized') ||
                (error as Error)?.message?.includes('Session expired')
              ) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      });
    }
  );

  return (
    <AntdRegistry>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          theme={{
            algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
            token: {
              colorPrimary: '#10b981', // Premium Emerald Green
              colorSuccess: '#10b981',
              colorError: '#f43f5e', // Soft Rose Red for Expenses
              borderRadius: 16, // Sleek modern roundings (rounded-2xl)
              fontFamily: "var(--sans), Inter, system-ui, sans-serif",
              ...(isDark
                ? {
                    colorBgContainer: '#0f172a',
                    colorBgElevated: '#1e293b',
                    colorBorder: '#334155',
                    colorText: '#f1f5f9',
                    colorTextSecondary: '#94a3b8',
                  }
                : {}),
            },
            components: {
              Modal: {
                contentBg: isDark ? '#0f172a' : '#ffffff',
                headerBg: 'transparent',
              },
              Select: {
                selectorBg: isDark ? '#1e293b' : '#ffffff',
              },
              DatePicker: {
                cellActiveWithRangeBg: isDark ? '#064e3b' : '#ecfdf5',
              },
              Table: {
                headerBg: isDark ? '#1e293b' : '#f8fafc',
                rowHoverBg: isDark ? '#1e293b' : '#f0fdf4',
              },
            },
          }}
        >
          <App>
            {children}
          </App>
        </ConfigProvider>
      </QueryClientProvider>
    </AntdRegistry>
  );
}

