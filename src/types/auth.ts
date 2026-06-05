// ============================================
// Authentication Type Definitions
// ============================================

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'EMPLOYEE';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  username: string;
  email: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  allowed_tabs?: string[];
  created_at: string;
}

export interface LoginCredentials {
  username_or_email: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: AuthTokens;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    access: string;
  };
}

export interface MeResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  setLoading: (loading: boolean) => void;
  hydrate: () => void;
}

// Role-based route mapping
export const ROLE_DASHBOARD_MAP: Record<UserRole, string> = {
  ADMIN: '/admin/dashboard',
  SUPERVISOR: '/supervisor/dashboard',
  EMPLOYEE: '/employee/dashboard',
};
