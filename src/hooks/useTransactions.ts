import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from './useAuthStore';

export interface Transaction {
  id: string;
  date: string;
  timestamp: number;
  item: string;
  type: 'Income' | 'Expense';
  category: string;
  amount: number;
  contribution: string;
  color: string;
}

/**
 * useTransactions Hook
 * Fetches the recent normalized transactions list from the database
 */
export const useTransactions = (month?: string, year?: string) => {
  const userId = useAuthStore((state) => state.user?.userId);
  return useQuery<Transaction[]>({
    queryKey: ['transactions', userId, month, year],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (month) queryParams.append('month', month);
      if (year) queryParams.append('year', year);

      const token = useAuthStore.getState().token;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/transactions?${queryParams.toString()}`, {
        headers
      });
      if (!res.ok) {
        throw new Error('Failed to fetch recent transactions');
      }
      return res.json();
    },
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * useCategoriesDescriptions Hook
 * Fetches category and unique description mappings for expense auto-selection
 */
export const useCategoriesDescriptions = () => {
  return useQuery<{ expenses: Record<string, string[]>; income: Record<string, string[]> }>({
    queryKey: ['categories-descriptions'],
    queryFn: async () => {
      const token = useAuthStore.getState().token;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/transactions/categories-descriptions', {
        headers
      });
      if (!res.ok) {
        throw new Error('Failed to fetch transaction categories metadata');
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * useAddTransaction Mutation Hook
 * Sends a new transaction to the backend, then triggers a live dashboard reload
 */
export const useAddTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newTx: {
      item: string;
      type: 'income' | 'expense';
      category: string;
      amount: number;
      date: string;
    }) => {
      const token = useAuthStore.getState().token;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers,
        body: JSON.stringify(newTx),
      });

      if (!res.ok) {
        throw new Error('Failed to save transaction');
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate both report summaries and recent transactions to trigger live chart animations
      queryClient.invalidateQueries({ queryKey: ['monthly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};
