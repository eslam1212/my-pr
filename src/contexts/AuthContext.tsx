import React, { createContext, useState, useEffect } from 'react';
import { AuthUser, LoginCredentials, AuthState } from '../types/auth';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    // التحقق من وجود بيانات المستخدم في التخزين المحلي عند التحميل الأولي
    const storedUser = localStorage.getItem('user');
    return {
      user: storedUser ? JSON.parse(storedUser) : null,
      isAuthenticated: !!storedUser,
      isLoading: true, // نبدأ بالتحميل لنتحقق من الجلسة
      error: null,
    };
  });

  const setAuthState = (session: Session | null) => {
    if (session) {
      // تحويل بيانات المستخدم من Supabase إلى الصيغة المطلوبة
      const user: AuthUser = {
        id: session.user.id,
        username: session.user.user_metadata.name || session.user.email?.split('@')[0] || '',
        email: session.user.email || '',
        role: session.user.user_metadata.role || 'user',
        permissions: session.user.user_metadata.permissions || []
      };
      
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('supabase_access_token', session.access_token);
      console.log('Auth state updated with valid session');
    } else {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      
      localStorage.removeItem('user');
      localStorage.removeItem('supabase_access_token');
      console.log('Auth state cleared - no valid session');
    }
  };

  // Refresh the session
  const refreshSession = async (): Promise<boolean> => {
    try {
      // Check if we've refreshed too many times recently
      const lastRefreshTime = parseInt(localStorage.getItem('last_token_refresh_time') || '0', 10);
      const now = Date.now();
      
      // If last refresh was less than 30 seconds ago, don't try again
      if (now - lastRefreshTime < 30000) {
        console.log("Rate limit protection: Skipping refresh, too recent");
        return true; // Return true to prevent cascading errors
      }
      
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) {
        console.error('Failed to refresh session:', error);
        setAuthState(null);
        return false;
      }
      
      // Make sure the token is available for API requests
      if (data.session?.access_token) {
        // This is crucial for our custom fetch implementation
        localStorage.setItem('supabase_access_token', data.session.access_token);
        localStorage.setItem('last_token_refresh_time', now.toString());
      }
      
      setAuthState(data.session);
      return true;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  };

  // Set up auto refresh for token
  useEffect(() => {
    let lastRefreshTime = Date.now();
    const minimumRefreshInterval = 60000; // 1 minute minimum between refreshes
    
    const refreshTimer = setInterval(async () => {
      // Don't refresh too frequently
      if (Date.now() - lastRefreshTime < minimumRefreshInterval) {
        console.log('Skipping refresh - too soon since last refresh');
        return;
      }
      
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          // Only refresh if we have less than 10 minutes left
          const expiresAt = data.session.expires_at || 0;
          const now = Math.floor(Date.now() / 1000);
          const timeLeft = expiresAt - now;
          
          if (timeLeft < 600) {
            console.log('Auto refreshing token...');
            await refreshSession();
            lastRefreshTime = Date.now();
          }
        }
      } catch (error) {
        console.error('Error in auto token refresh:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => {
      clearInterval(refreshTimer);
    };
  }, []);
  
  // Set up session refresh on window focus
  useEffect(() => {
    let lastVisibilityRefreshTime = Date.now();
    const minimumVisibilityRefreshInterval = 60000; // 1 minute minimum between refreshes
    
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // Don't refresh too frequently
        if (Date.now() - lastVisibilityRefreshTime < minimumVisibilityRefreshInterval) {
          console.log('Skipping visibility-triggered refresh - too soon since last refresh');
          return;
        }
        
        console.log('Document became visible, checking session...');
        try {
          const { data } = await supabase.auth.getSession();
          
          if (data.session) {
            // We have a session, check if it needs refresh
            const expiresAt = data.session.expires_at || 0;
            const now = Math.floor(Date.now() / 1000);
            const timeLeft = expiresAt - now;
            
            if (timeLeft < 600) { // Less than 10 minutes left
              console.log('Session expiring soon, refreshing on visibility change...');
              await refreshSession();
              lastVisibilityRefreshTime = Date.now();
            }
          }
        } catch (error) {
          console.error('Error in visibility session check:', error);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // التحقق من حالة الجلسة عند تحميل التطبيق
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (event === 'SIGNED_IN' && session) {
          setAuthState(session);
        } else if (event === 'SIGNED_OUT') {
          setAuthState(null);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setAuthState(session);
        } else if (event === 'USER_UPDATED' && session) {
          setAuthState(session);
        }
      }
    );

    // التحقق من وجود جلسة حالية
    const checkCurrentSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error);
          setAuthState(null);
          return;
        }
        
        if (session) {
          console.log('Active session found during initialization');
          
          // Check if token needs refresh
          const expiresAt = session.expires_at || 0;
          const now = Math.floor(Date.now() / 1000);
          const timeLeft = expiresAt - now;
          
          if (timeLeft < 300) { // Less than 5 minutes left
            console.log('Token expiring soon, refreshing...');
            await refreshSession();
          } else {
            setAuthState(session);
          }
        } else {
          // لا توجد جلسة نشطة
          setAuthState(null);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setAuthState(null);
      }
    };
    
    checkCurrentSession();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('Attempting login with:', credentials.email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      console.log('Login successful:', data);
      if (data.session) {
        setAuthState(data.session);
      }
    } catch (err) {
      console.error('Login error:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'حدث خطأ أثناء تسجيل الدخول',
      }));
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Clear stored tokens first to prevent any race conditions
      localStorage.removeItem('user');
      localStorage.removeItem('supabase_access_token');
      localStorage.removeItem('supabase-auth-token');
      localStorage.removeItem('auth_debug_info');
      
      const { error } = await supabase.auth.signOut({ 
        scope: 'global' // Sign out from all tabs/windows
      });
      
      if (error) {
        throw error;
      }
      
      // Final cleanup
      setAuthState(null);
      
      // Force reload to clear any in-memory state
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل الخروج',
      }));
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}
