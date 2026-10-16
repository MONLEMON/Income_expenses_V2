import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'POS Income & Expense Tracker',
    short_name: 'POS Financials',
    description: 'Unified premium portal for managing income, expenses, budgets, and cashflow analytics',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#10b981',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
    ],
  };
}
