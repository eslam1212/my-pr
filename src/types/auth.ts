export type UserRole = 'admin' | 'accountant' | 'viewer';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UserFormData {
  email: string;
  password?: string; // Optional here, but checked in createUser
  // Add other fields from your 'users' table that can be set via a form
  name?: string; // Example: if you have a name field
  // role?: UserRole; // Example: if role can be set (be cautious with this)
}
