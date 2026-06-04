import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from './useAuthStore';

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
      const token = useAuthStore.getState().token;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/budgets?month=${month}&year=${year}`, {
        headers,
      });
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
      const token = useAuthStore.getState().token;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers,
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
      const token = useAuthStore.getState().token;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/budgets?id=${budgetId}`, {
        method: 'DELETE',
        headers,
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
      const token = useAuthStore.getState().token;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/savings-goals', {
        headers,
      });
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
      const token = useAuthStore.getState().token;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/savings-goals', {
        method: 'POST',
        headers,
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
      const token = useAuthStore.getState().token;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/savings-goals', {
        method: 'PUT',
        headers,
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
      const token = useAuthStore.getState().token;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`/api/savings-goals?id=${goalId}`, {
        method: 'DELETE',
        headers,
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
