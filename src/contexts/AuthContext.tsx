import React, { createContext, useState, useEffect, useCallback, useRef } from 'react'; // Added useCallback, useRef
import { AuthUser, LoginCredentials, AuthState } from '../types/auth';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { authService } from '../services/authService'; // For local logout

const IDLE_TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>; // This might need to be updated for 2FA flow
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  // setUserSession: (session: Session) => void; // If LoginForm needs to directly set session
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const storedUser = localStorage.getItem('user');
    return {
      user: storedUser ? JSON.parse(storedUser) : null,
      isAuthenticated: !!storedUser,
      isLoading: true,
      error: null,
    };
  });

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const setAuthState = useCallback((session: Session | null) => {
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
          resetIdleTimer(); // Reset idle timer on sign-in
        } else if (event === 'SIGNED_OUT') {
          setAuthState(null);
          clearIdleTimer(); // Clear idle timer on sign-out
        } else if (event === 'TOKEN_REFRESHED') {
          if (session) {
            setAuthState(session);
            resetIdleTimer(); // Reset idle timer on token refresh
          } else {
            // If token refresh results in null session, it means refresh failed (e.g. refresh token expired)
            console.log('Token refresh failed, signing out.');
            setAuthState(null); // This will trigger redirect via effect or protected routes
            clearIdleTimer();
          }
        } else if (event === 'USER_UPDATED' && session) {
          setAuthState(session); // User profile updated, session might be the same or new
          resetIdleTimer();
        } else if (event === 'PASSWORD_RECOVERY') {
            // Handle password recovery state if needed (e.g. redirect to reset password page)
            clearIdleTimer(); // User is effectively logged out until password reset
        } else if (event === 'USER_DELETED') {
            setAuthState(null);
            clearIdleTimer();
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
          clearIdleTimer();
          return;
        }
        
        if (session) {
          console.log('Active session found during initialization');
          const expiresAt = session.expires_at || 0;
          const now = Math.floor(Date.now() / 1000);
          const timeLeft = expiresAt - now;
          
          if (timeLeft < 300) { // Less than 5 minutes left
            console.log('Token expiring soon, refreshing...');
            await refreshSession(); // refreshSession itself calls setAuthState and resets idle timer
          } else {
            setAuthState(session);
            resetIdleTimer();
          }
        } else {
          setAuthState(null);
          clearIdleTimer();
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setAuthState(null);
        clearIdleTimer();
      }
    };
    
    checkCurrentSession();
    
    // Cleanup subscription on component unmount
    return () => {
      subscription?.unsubscribe();
      clearIdleTimer();
    };
  }, [setAuthState, refreshSession]); // Added refreshSession to dependencies

  // --- Idle Timeout Logic ---
  const handleIdleLogout = useCallback(async () => {
    console.log("User idle, logging out...");
    toast({ // Assuming toast is available or can be passed/imported
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك بسبب عدم النشاط.",
      variant: "info",
    });
    await authService.logout(); // Use the local logout from authService
    setAuthState(null); // Ensure state is cleared
    // The onAuthStateChange for SIGNED_OUT should also handle clearing state and redirecting.
  }, [setAuthState, toast]); // Added toast

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(handleIdleLogout, IDLE_TIMEOUT_DURATION);
    // console.log_once('Idle timer reset.'); 
  }, [handleIdleLogout]);

  const clearIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      // console.log_once('Idle timer cleared.');
    }
  };

  useEffect(() => {
    // Only set up idle timer if user is authenticated
    if (state.isAuthenticated) {
      const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => window.addEventListener(event, resetIdleTimer));
      resetIdleTimer(); // Start the timer when user becomes authenticated

      return () => {
        events.forEach(event => window.removeEventListener(event, resetIdleTimer));
        clearIdleTimer();
      };
    } else {
      clearIdleTimer(); // Clear timer if not authenticated
    }
  }, [state.isAuthenticated, resetIdleTimer]);
  // --- End Idle Timeout Logic ---


  const login = async (credentials: LoginCredentials) => {
    // This login function is now primarily for the initial password login.
    // The 2FA step is handled by LoginForm directly calling authService methods.
    // If login is successful (with or without 2FA), onAuthStateChange will update the state.
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
      localStorage.removeItem('supabase_access_token'); // This might be set by older versions or manual steps
      localStorage.removeItem('supabase-auth-token'); // Supabase's default key
      localStorage.removeItem('auth_debug_info'); // Custom debug info
      
      // Use the authService.logout which might have more comprehensive logic
      // (though current authService.logout is simple supabase.auth.signOut())
      // The key is that onAuthStateChange will pick up the SIGNED_OUT event.
      await authService.logout(); 
      // setAuthState(null) will be called by onAuthStateChange.
      // Redirecting here might be premature if onAuthStateChange handles it.
      // However, explicit redirect ensures timely navigation.
      if (window.location.pathname !== '/login') {
         window.location.href = '/login'; // Redirect if not already on login page
      }
    } catch (error) { // Renamed err to error for consistency
      console.error('Error signing out from AuthContext:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل الخروج',
      }));
    }
  };

  // This function can be used by LoginForm after successful 2FA to update context if needed,
  // though onAuthStateChange should ideally handle it.
  // const setUserSession = (session: Session) => {
  //   setAuthState(session);
  // };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshSession /*, setUserSession */ }}>
      {children}
    </AuthContext.Provider>
  );
}

// Helper for toast (or import from a central place if it exists)
const toast = ({ title, description, variant }: { title: string, description: string, variant?: string }) => {
  console.log(`Toast: ${title} - ${description} (Variant: ${variant || 'default'})`);
  // In a real app, this would call the actual toast function from a library like react-toastify or shadcn/ui.
  // For example, if using shadcn/ui's useToast:
  // const { toast: actualToast } = useToast();
  // actualToast({ title, description, variant });
};
