'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ConfigProvider, App } from 'antd';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { useAuthStore } from '@/hooks/useAuthStore';
import { ApiError } from '@/lib/apiClient';

export default function Providers({ children }: { children: React.ReactNode }) {
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
            token: {
              colorPrimary: '#10b981', // Premium Emerald Green
              colorSuccess: '#10b981',
              colorError: '#f43f5e', // Soft Rose Red for Expenses
              borderRadius: 16, // Sleek modern roundings (rounded-2xl)
              fontFamily: "var(--sans), Inter, system-ui, sans-serif"
            },
            components: {
              Modal: {
                contentBg: '#ffffff',
                headerBg: 'transparent',
              },
              Select: {
                selectorBg: '#ffffff',
              },
              DatePicker: {
                cellActiveWithRangeBg: '#ecfdf5',
              }
            }
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
