import { useState, useEffect } from 'react';
import { supabase, checkConnection } from '../lib/supabase';

export function useSupabase() {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSupabaseConnection = async () => {
      setIsChecking(true);
      const connected = await checkConnection();
      setIsConnected(connected);
      setIsChecking(false);
    };

    checkSupabaseConnection();

    // Recheck connection on visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkSupabaseConnection();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { supabase, isConnected, isChecking };
}
