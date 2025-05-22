import React, { createContext, useState, useEffect } from 'react';
import { AuthUser, LoginCredentials, AuthState } from '../types/auth';
import { authService } from '../services/authService';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  // جلب بيانات المستخدم الحالي عند تحميل المكون
  useEffect(() => {
    const fetchCurrentUser = async () => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          const authUser: AuthUser = {
            id: user.id,
            username: user.email || 'Unknown',
            email: user.email || '',
            role: 'admin', // يمكن جلب الدور من قاعدة البيانات
            permissions: [], // يمكن جلب الصلاحيات من قاعدة البيانات
          };
          setState({
            user: authUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          localStorage.setItem('user', JSON.stringify(authUser));
        }
      } catch (error) {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'فشل في جلب بيانات المستخدم',
        });
        localStorage.removeItem('user');
      }
    };

    fetchCurrentUser();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await authService.login(credentials.email, credentials.password);
      if (data.user) {
        const authUser: AuthUser = {
          id: data.user.id,
          username: data.user.email || 'Unknown',
          email: data.user.email || '',
          role: 'admin', // يمكن جلب الدور من قاعدة البيانات
          permissions: [], // يمكن جلب الصلاحيات من قاعدة البيانات
        };
        setState({
          user: authUser,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        localStorage.setItem('user', JSON.stringify(authUser));
      }
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      });
      localStorage.removeItem('user');
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      localStorage.removeItem('user');
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'فشل في تسجيل الخروج',
      });
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
