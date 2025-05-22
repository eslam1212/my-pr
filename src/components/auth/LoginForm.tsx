import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Loader } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PageWrapper } from '../layout/PageWrapper';
import { supabase } from '../../lib/supabase';

const loginSchema = z.object({
  email: z.string()
    .email('البريد الإلكتروني غير صالح')
    .min(1, 'البريد الإلكتروني مطلوب'),
  password: z.string()
    .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
    .max(50, 'كلمة المرور طويلة جداً')
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login, isLoading, error } = useAuth();
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoginAttempted(true);
    setDebugInfo(null);
    
    try {
      // Attempt login
      await login(data);
      
      // Check if we got a session after login
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error getting session after login:", sessionError);
        setDebugInfo("فشل في جلب الجلسة بعد تسجيل الدخول");
      } else if (!sessionData.session) {
        console.error("No session found after login");
        setDebugInfo("لم يتم إنشاء جلسة صحيحة بعد تسجيل الدخول");
      } else {
        console.log("Login successful, session created", sessionData.session);
        
        // Ensure auth token is available for API requests (add explicit headers)
        if (sessionData.session.access_token) {
          localStorage.setItem('supabase_access_token', sessionData.session.access_token);
          
          // Don't try to access protected properties
          console.log('Auth token saved for API requests');
        }
        
        localStorage.setItem('auth_debug_info', JSON.stringify({
          login_time: new Date().toISOString(),
          user_id: sessionData.session.user.id,
          expires_at: sessionData.session.expires_at,
          token_length: sessionData.session.access_token?.length || 0
        }));
      }
    } catch (err) {
      console.error("Login error:", err);
      setDebugInfo(err instanceof Error ? err.message : "خطأ غير معروف أثناء تسجيل الدخول");
    }
  };

  // Show debug buttons in development environment only
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <PageWrapper className="min-h-screen bg-gradient-to-br from-indigo-100 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            مرحباً بك في نظام محاسب
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            قم بتسجيل الدخول للوصول إلى لوحة التحكم
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {debugInfo && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">{debugInfo}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  className="appearance-none rounded-lg relative block w-full pr-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="أدخل بريدك الإلكتروني"
                  dir="ltr"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  type="password"
                  className="appearance-none rounded-lg relative block w-full pr-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="أدخل كلمة المرور"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="mr-2 block text-sm text-gray-900">
                تذكرني
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                نسيت كلمة المرور؟
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {isLoading ? (
              <Loader className="animate-spin h-5 w-5" />
            ) : (
              'تسجيل الدخول'
            )}
          </button>

          {isDevelopment && loginAttempted && (
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={async () => {
                  const { data } = await supabase.auth.getSession();
                  setDebugInfo(data.session ? 
                    `جلسة صالحة حتى: ${new Date((data.session.expires_at || 0) * 1000).toLocaleString()}` : 
                    'لا توجد جلسة نشطة');
                }}
                className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                التحقق من حالة الجلسة
              </button>
            </div>
          )}
        </form>
      </div>
    </PageWrapper>
  );
}
