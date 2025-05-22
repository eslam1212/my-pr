import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export function LoginPage() {
  const { isAuthenticated, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  // Check for existing session and try to restore it
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First check if we already have a valid session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking session in LoginPage:", error);
        } else if (data.session) {
          console.log("Found existing session in LoginPage");
          await refreshSession();
        } else {
          console.log("No active session found in LoginPage");
        }
      } catch (err) {
        console.error("Error in LoginPage session check:", err);
      } finally {
        setChecking(false);
      }
    };
    
    checkSession();
  }, [refreshSession]);

  // إذا كان المستخدم مسجل الدخول بالفعل، قم بتوجيهه إلى لوحة التحكم
  useEffect(() => {
    if (!checking && isAuthenticated) {
      console.log("User is authenticated, redirecting to dashboard");
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate, checking]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return <LoginForm />;
} 