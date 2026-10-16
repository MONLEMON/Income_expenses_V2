import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from './useAuthStore';
import { fetchWithAuth } from '@/lib/apiClient';

export interface Budget {
  budgetId: number;
  category: string;
  amount: string;
  period: string;
  month: string;
  year: string;
}

export interface SavingsGoal {
  goalId: number;
  name: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string | null;
  createdAt: string;
}

export const useBudgets = (month: string, year: string) => {
  const userId = useAuthStore((state) => state.user?.userId);
  return useQuery<Budget[]>({
    queryKey: ['budgets', userId, month, year],
    queryFn: async () => {
      const res = await fetchWithAuth(`/api/budgets?month=${month}&year=${year}`);
      if (!res.ok) {
        throw new Error('Failed to fetch budgets');
      }
      return res.json();
    },
    staleTime: 60 * 1000,
  });
};

export const useSaveBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { category: string; amount: number; month: string; year: string }) => {
      const res = await fetchWithAuth('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save budget');
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', useAuthStore.getState().user?.userId, variables.month, variables.year] });
    },
  });
};

export const useDeleteBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (budgetId: number) => {
      const res = await fetchWithAuth(`/api/budgets?id=${budgetId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete budget');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
};

export const useSavingsGoals = () => {
  const userId = useAuthStore((state) => state.user?.userId);
  return useQuery<SavingsGoal[]>({
    queryKey: ['savings-goals', userId],
    queryFn: async () => {
      const res = await fetchWithAuth('/api/savings-goals');
      if (!res.ok) {
        throw new Error('Failed to fetch savings goals');
      }
      return res.json();
    },
    staleTime: 60 * 1000,
  });
};

export const useSaveSavingsGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; targetAmount: number; currentAmount?: number; targetDate?: string | null }) => {
      const res = await fetchWithAuth('/api/savings-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save savings goal');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
    },
  });
};

export const useAddContributionToGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { goalId: number; amountToAdd: number }) => {
      const res = await fetchWithAuth('/api/savings-goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update savings goal');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
    },
  });
};

export const useDeleteSavingsGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (goalId: number) => {
      const res = await fetchWithAuth(`/api/savings-goals?id=${goalId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete savings goal');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-goals'] });
    },
  });
};
