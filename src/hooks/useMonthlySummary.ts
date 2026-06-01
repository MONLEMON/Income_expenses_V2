import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from './useAuthStore';

export interface MonthlySummaryItem {
  month: string;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}

export interface KPIStats {
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
  totalSaving: number;
  incomeTrend: number;
  expenseTrend: number;
  balanceTrend: number;
  savingTrend: number;
}

export interface MonthlySummaryResponse {
  summary: MonthlySummaryItem[];
  kpis: KPIStats;
}

const fetchMonthlySummary = async (year?: string): Promise<MonthlySummaryResponse> => {
  const url = year 
    ? `/api/reports/monthly-summary?year=${year}`
    : '/api/reports/monthly-summary';
    
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  
  return response.json();
};

export const useMonthlySummary = (year?: string) => {
  const userId = useAuthStore((state) => state.user?.userId);
  return useQuery({
    queryKey: ['monthly-summary', userId, year],
    queryFn: () => fetchMonthlySummary(year),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
