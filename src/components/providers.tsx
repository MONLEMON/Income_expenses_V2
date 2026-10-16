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
                    colorBgContainer: '#1e293b',
                    colorBgElevated: '#1e293b',
                    colorBgLayout: '#020617',
                    colorBorder: '#334155',
                    colorBorderSecondary: '#1e293b',
                    colorText: '#f8fafc',
                    colorTextSecondary: '#cbd5e1',
                    colorTextPlaceholder: '#64748b',
                  }
                : {}),
            },
            components: {
              Modal: {
                contentBg: isDark ? '#0f172a' : '#ffffff',
                headerBg: 'transparent',
                titleColor: isDark ? '#f8fafc' : '#0f172a',
              },
              Input: {
                colorBgContainer: isDark ? '#1e293b' : '#ffffff',
                colorText: isDark ? '#f8fafc' : '#0f172a',
                colorTextPlaceholder: isDark ? '#64748b' : '#94a3b8',
                colorBorder: isDark ? '#334155' : '#e2e8f0',
                activeBg: isDark ? '#1e293b' : '#ffffff',
                hoverBg: isDark ? '#1e293b' : '#ffffff',
              },
              InputNumber: {
                colorBgContainer: isDark ? '#1e293b' : '#ffffff',
                colorText: isDark ? '#f8fafc' : '#0f172a',
                colorTextPlaceholder: isDark ? '#64748b' : '#94a3b8',
                colorBorder: isDark ? '#334155' : '#e2e8f0',
                activeBg: isDark ? '#1e293b' : '#ffffff',
                hoverBg: isDark ? '#1e293b' : '#ffffff',
              },
              Select: {
                selectorBg: isDark ? '#1e293b' : '#ffffff',
                colorBgElevated: isDark ? '#1e293b' : '#ffffff',
                colorText: isDark ? '#f8fafc' : '#0f172a',
                colorTextPlaceholder: isDark ? '#64748b' : '#94a3b8',
                colorBorder: isDark ? '#334155' : '#e2e8f0',
                optionSelectedBg: isDark ? 'rgba(16, 185, 129, 0.22)' : '#ecfdf5',
                optionSelectedColor: isDark ? '#6ee7b7' : '#065f46',
                optionActiveBg: isDark ? '#334155' : '#f8fafc',
              },
              DatePicker: {
                colorBgContainer: isDark ? '#1e293b' : '#ffffff',
                colorBgElevated: isDark ? '#1e293b' : '#ffffff',
                colorText: isDark ? '#f8fafc' : '#0f172a',
                colorTextPlaceholder: isDark ? '#64748b' : '#94a3b8',
                colorBorder: isDark ? '#334155' : '#e2e8f0',
                cellActiveWithRangeBg: isDark ? '#064e3b' : '#ecfdf5',
              },
              Segmented: {
                trackBg: isDark ? '#1e293b' : '#f1f5f9',
                itemSelectedBg: isDark ? '#0f172a' : '#ffffff',
                itemSelectedColor: isDark ? '#34d399' : '#0f172a',
                itemColor: isDark ? '#94a3b8' : '#64748b',
                itemHoverColor: isDark ? '#f8fafc' : '#0f172a',
              },
              Table: {
                colorBgContainer: isDark ? '#0f172a' : '#ffffff',
                headerBg: isDark ? '#1e293b' : '#f8fafc',
                headerColor: isDark ? '#94a3b8' : '#64748b',
                rowHoverBg: isDark ? '#1e293b' : '#f0fdf4',
                borderColor: isDark ? '#1e293b' : '#f1f5f9',
              },
              Card: {
                colorBgContainer: isDark ? '#0f172a' : '#ffffff',
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

