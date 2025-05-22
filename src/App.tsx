import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SettingsProvider } from './components/providers/SettingsProvider';
import { supabase } from './lib/supabase';
import { useAuth } from './hooks/useAuth';

// App component is a wrapper for the application
// It applies the SettingsProvider context to all child components
// The Outlet component renders the matched child route
export function App() {
  const { refreshSession, isAuthenticated } = useAuth();
  
  // Ensure auth is properly initialized when the app starts
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we've refreshed too many times recently
        const lastRefreshTime = parseInt(localStorage.getItem('last_token_refresh_time') || '0', 10);
        const now = Date.now();
        
        // If last refresh was less than 30 seconds ago, don't refresh during init
        if (now - lastRefreshTime < 30000) {
          console.log("Skipping init refresh - too recent since last refresh");
          return;
        }
        
        // Check if we have a session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking auth session:", error);
        } else if (data.session) {
          console.log("Session found in App component");
          
          // Only refresh if token is about to expire
          const expiresAt = data.session.expires_at || 0;
          const nowSeconds = Math.floor(Date.now() / 1000);
          const timeLeft = expiresAt - nowSeconds;
          
          // Only refresh if less than 10 minutes left
          if (isAuthenticated && timeLeft < 600) {
            await refreshSession();
            localStorage.setItem('last_token_refresh_time', Date.now().toString());
            console.log("Session refreshed during app initialization");
          }
        } else {
          console.log("No active session found in App component");
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      }
    };
    
    initAuth();
  }, [isAuthenticated, refreshSession]);

  return (
    <SettingsProvider>
      <Outlet />
    </SettingsProvider>
  );
}
