'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App } from 'antd';
import { AntdRegistry } from '@ant-design/nextjs-registry';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
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
