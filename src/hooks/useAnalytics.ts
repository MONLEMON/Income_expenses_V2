import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from './useAuthStore';

export interface DailyTrend {
  date: string;
  income: number;
  expense: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface AnalyticsKPIs {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  profitMargin: number;
  savingsRate: number;
  dailyAvgIncome: number;
  dailyAvgExpense: number;
  diffDays: number;
}

export interface PriorComparison {
  priorStartDate: string;
  priorEndDate: string;
  incomeChange: number | null;
  expenseChange: number | null;
  profitChange: number | null;
}

export interface AnalyticsData {
  dailyTrends: DailyTrend[];
  kpis: AnalyticsKPIs;
  comparison: PriorComparison;
  breakdowns: {
    expenses: CategoryBreakdown[];
    income: CategoryBreakdown[];
  };
}

/**
 * Hook to retrieve flexible financial analytics metrics for a date range
 */
export const useAnalytics = (startDate: string, endDate: string) => {
  const userId = useAuthStore((state) => state.user?.userId);
  return useQuery<AnalyticsData>({
    queryKey: ['financial-analytics', userId, startDate, endDate],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append('startDate', startDate);
      queryParams.append('endDate', endDate);

      const token = useAuthStore.getState().token;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/reports/analytics?${queryParams.toString()}`, { headers });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch financial analytics');
      }
      return res.json();
    },
    enabled: !!startDate && !!endDate,
    staleTime: 60 * 1000, // 1 minute
  });
};
