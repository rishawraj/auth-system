export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  oauth_provider?: string;
  is_active: boolean;
  last_login?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}
