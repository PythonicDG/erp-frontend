'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/auth-store';
import { tokenStorage } from '@/lib/token-storage';
import type { LoginCredentials, LoginResponse, MeResponse, ROLE_DASHBOARD_MAP } from '@/types/auth';
import { ROLE_DASHBOARD_MAP as roleDashboardMap } from '@/types/auth';

/**
 * Custom hook providing authentication actions:
 * - login: authenticate and redirect to role-based dashboard
 * - logout: blacklist token and redirect to login
 * - fetchUser: get current user profile
 */
export function useAuth() {
  const router = useRouter();
  const { login: storeLogin, logout: storeLogout, setUser, setLoading } = useAuthStore();

  const loginAction = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        setLoading(true);
        const response = await api.post<LoginResponse>('/api/auth/login/', credentials);
        const { user, tokens } = response.data.data;

        storeLogin(user, tokens);
        toast.success(`Welcome back, ${user.first_name}!`);

        // Redirect to role-based dashboard
        const dashboardPath = roleDashboardMap[user.role] || '/employee/dashboard';
        router.push(dashboardPath);

        return { success: true };
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        const message = err?.response?.data?.message || 'Login failed. Please try again.';
        toast.error(message);
        return { success: false, message };
      } finally {
        setLoading(false);
      }
    },
    [router, storeLogin, setLoading]
  );

  const logoutAction = useCallback(async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        await api.post('/api/auth/logout/', { refresh: refreshToken });
      }
    } catch {
      // Silently handle — we log out locally regardless
    } finally {
      storeLogout();
      toast.success('Logged out successfully');
      router.push('/login');
    }
  }, [router, storeLogout]);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<MeResponse>('/api/auth/me/');
      setUser(response.data.data);
      return response.data.data;
    } catch {
      storeLogout();
      return null;
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading, storeLogout]);

  return {
    login: loginAction,
    logout: logoutAction,
    fetchUser,
  };
}
