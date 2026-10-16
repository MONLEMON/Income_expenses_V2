import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from './useAuthStore';
import { fetchWithAuth } from '@/lib/apiClient';

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
export const useTransactions = (
  month?: string,
  year?: string,
  startDate?: string,
  endDate?: string
) => {
  const userId = useAuthStore((state) => state.user?.userId);
  return useQuery<Transaction[]>({
    queryKey: ['transactions', userId, month, year, startDate, endDate],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (startDate && endDate) {
        queryParams.append('startDate', startDate);
        queryParams.append('endDate', endDate);
      } else {
        if (month) queryParams.append('month', month);
        if (year) queryParams.append('year', year);
      }

      const res = await fetchWithAuth(`/api/transactions?${queryParams.toString()}`);
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
      const res = await fetchWithAuth('/api/transactions/categories-descriptions');
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
      const res = await fetchWithAuth('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTx),
      });

      if (!res.ok) {
        throw new Error('Failed to save transaction');
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate report summaries, recent transactions, and category-description mappings
      queryClient.invalidateQueries({ queryKey: ['monthly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['categories-descriptions'] });
    },
  });
};

/**
 * useUpdateTransaction Mutation Hook
 * Sends updated transaction details to the backend
 */
export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updatedTx: {
      id: string;
      item: string;
      type: 'income' | 'expense';
      category: string;
      amount: number;
      date: string;
    }) => {
      const res = await fetchWithAuth('/api/transactions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTx),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update transaction');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['categories-descriptions'] });
    },
  });
};

/**
 * useDeleteTransaction Mutation Hook
 * Deletes the specified transaction by ID
 */
export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transactionId: string) => {
      const res = await fetchWithAuth(`/api/transactions?id=${transactionId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete transaction');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-summary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['categories-descriptions'] });
    },
  });
};
