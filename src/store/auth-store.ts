import { create } from 'zustand';
import type { AuthState, User, AuthTokens } from '@/types/auth';
import { tokenStorage } from '@/lib/token-storage';

/**
 * Zustand auth store for managing authentication state globally.
 * Persists tokens via cookie storage and supports hydration from SSR.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  login: (user: User, tokens: AuthTokens) => {
    tokenStorage.setTokens(tokens);
    set({
      user,
      accessToken: tokens.access,
      refreshToken: tokens.refresh,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: () => {
    tokenStorage.clearTokens();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setUser: (user: User) => {
    set({ user });
  },

  setAccessToken: (token: string) => {
    set({ accessToken: token });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  /**
   * Hydrate the store from cookie storage on app load.
   * Called from the client-side auth provider.
   */
  hydrate: () => {
    const accessToken = tokenStorage.getAccessToken();
    const refreshToken = tokenStorage.getRefreshToken();

    if (accessToken && refreshToken) {
      set({
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: true, // Will be set to false after user fetch
      });
    } else {
      set({
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
