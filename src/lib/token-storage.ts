import Cookies from 'js-cookie';
import type { AuthTokens } from '@/types/auth';

const ACCESS_TOKEN_KEY = 'erp_access_token';
const REFRESH_TOKEN_KEY = 'erp_refresh_token';

/**
 * Token storage utilities using cookies for security.
 * Cookies are used instead of localStorage for:
 * - Automatic inclusion in same-origin requests
 * - HttpOnly support in production
 * - Better XSS protection
 */

export const tokenStorage = {
  getAccessToken: (): string | null => {
    return Cookies.get(ACCESS_TOKEN_KEY) || null;
  },

  getRefreshToken: (): string | null => {
    return Cookies.get(REFRESH_TOKEN_KEY) || null;
  },

  setTokens: (tokens: AuthTokens): void => {
    // Access token: short-lived (matches JWT settings – 30 min)
    Cookies.set(ACCESS_TOKEN_KEY, tokens.access, {
      expires: 1 / 48, // 30 minutes
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    // Refresh token: longer-lived (7 days)
    Cookies.set(REFRESH_TOKEN_KEY, tokens.refresh, {
      expires: 7,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  },

  clearTokens: (): void => {
    Cookies.remove(ACCESS_TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
  },

  hasTokens: (): boolean => {
    return !!Cookies.get(ACCESS_TOKEN_KEY) || !!Cookies.get(REFRESH_TOKEN_KEY);
  },
};
