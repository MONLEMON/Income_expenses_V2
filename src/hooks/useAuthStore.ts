import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  userId: number;
  username: string;
  fullName: string;
}

/**
 * Checks if a JWT token is expired or invalid
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    // Normalize base64url to base64
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    const jsonPayload =
      typeof window !== 'undefined' && window.atob
        ? decodeURIComponent(
            window
              .atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          )
        : Buffer.from(base64, 'base64').toString('utf-8');

    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;

    // Buffer of 10 seconds before actual expiration
    return payload.exp * 1000 <= Date.now() + 10000;
  } catch {
    return true;
  }
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  checkAuthValidity: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => {
        if (isTokenExpired(token)) {
          set({ user: null, token: null, isAuthenticated: false });
          return;
        }
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('pos-auth-storage');
          } catch {}
        }
      },
      checkAuthValidity: () => {
        const { token, isAuthenticated } = get();
        if (!isAuthenticated || !token || isTokenExpired(token)) {
          get().logout();
          return false;
        }
        return true;
      },
    }),
    {
      name: 'pos-auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.token && isTokenExpired(state.token)) {
          state.logout();
        }
      },
    }
  )
);

