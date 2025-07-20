import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Loader, Shield } from 'lucide-react'; // Added Shield for 2FA icon
import { useAuth } from '../../hooks/useAuth'; // We'll use login function from here
import { authService, LoginResult, Verify2FAResult } from '../../services/authService'; // Import authService directly for 2FA logic
import { PageWrapper } from '../layout/PageWrapper';
import { supabase } from '../../lib/supabase'; // For debug session check

// Schema for the main login form
const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح').min(1, 'البريد الإلكتروني مطلوب'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').max(50, 'كلمة المرور طويلة جداً'),
});
type LoginFormData = z.infer<typeof loginSchema>;

// Schema for the 2FA token input
const twoFactorSchema = z.object({
  token: z.string().min(6, 'الرمز يجب أن يكون 6 أرقام').max(8, 'الرمز غير صالح'), // Allow for 8 in case of backup codes with dashes
});
type TwoFactorFormData = z.infer<typeof twoFactorSchema>;

export function LoginForm() {
  // useAuth hook provides login, isLoading, error, and potentially navigation/state updates
  const { login: contextLogin, isLoading: contextIsLoading, error: contextError, setUserSession } = useAuth();

  // Local state for this component
  const [isLoading, setIsLoading] = useState(false); // Combined loading state
  const [error, setError] = useState<string | null>(null); // Combined error state

  const [requires2FAInput, setRequires2FAInput] = useState(false);
  const [userIdFor2FA, setUserIdFor2FA] = useState<string | null>(null);
  
  const [loginAttempted, setLoginAttempted] = useState(false); // For debug
  const [debugInfo, setDebugInfo] = useState<string | null>(null); // For debug

  const { register: registerLogin, handleSubmit: handleSubmitLogin, formState: { errors: loginErrors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const { register: register2FA, handleSubmit: handleSubmit2FA, formState: { errors: twoFactorErrors } } = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
  });

  const handlePrimaryLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    setDebugInfo(null);
    setLoginAttempted(true);

    const result: LoginResult = await authService.login(data.email, data.password);

    if (result.error) {
      setError(result.error.message || 'فشل تسجيل الدخول.');
      setIsLoading(false);
    } else if (result.requires2FA && result.userId) {
      setUserIdFor2FA(result.userId);
      setRequires2FAInput(true);
      setIsLoading(false);
      setError(null); // Clear previous login errors
    } else if (result.session && result.user) {
      // Login successful, 2FA not required or already handled by a persistent session.
      // The useAuth hook's login function or a dedicated session setter should handle this.
      // For now, we can call a hypothetical setUserSession from useAuth or navigate.
      if (setUserSession) { // Check if setUserSession is provided by useAuth
        setUserSession(result.session); // Update auth context
      } else {
         // Fallback: Manually update localStorage and reload or navigate. This is less ideal.
        localStorage.setItem('supabase_access_token', result.session.access_token);
        window.location.reload(); // Or navigate to dashboard
      }
      // No need to set isLoading to false here if navigation occurs
    } else {
      // Should not happen if service returns correctly
      setError('استجابة غير متوقعة من خادم المصادقة.');
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (data: TwoFactorFormData) => {
    if (!userIdFor2FA) {
      setError('معرف المستخدم مفقود لمصادقة 2FA.');
      return;
    }
    setIsLoading(true);
    setError(null);

    const result: Verify2FAResult = await authService.verifyTwoFactorLoginToken(userIdFor2FA, data.token.replace('-', ''));

    if (result.error) {
      setError(result.error.message || 'فشل التحقق من رمز المصادقة الثنائية.');
      setIsLoading(false);
    } else if (result.session && result.user) {
      // 2FA successful, session is now fully authenticated.
      // useAuth hook or context should handle this.
      if (setUserSession) {
        setUserSession(result.session); // Update auth context
      } else {
        localStorage.setItem('supabase_access_token', result.session.access_token);
        window.location.reload(); // Or navigate
      }
      // No need to set isLoading to false here if navigation occurs
    } else {
      setError('استجابة غير متوقعة بعد التحقق من المصادقة الثنائية.');
      setIsLoading(false);
    }
  };

  // Prioritize local error, then context error
  const displayError = error || contextError;

  const isDevelopment = process.env.NODE_ENV === 'development';

  if (requires2FAInput) {
    return (
      <PageWrapper className="min-h-screen bg-gradient-to-br from-indigo-100 to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
          <div>
            <div className="mx-auto h-16 w-16 bg-green-600 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900">
              التحقق من المصادقة الثنائية
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              أدخل الرمز من تطبيق المصادقة الخاص بك.
            </p>
          </div>

          {displayError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{displayError}</p>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit2FA(handle2FASubmit)}>
            <div>
              <label htmlFor="twoFactorToken" className="block text-sm font-medium text-gray-700 mb-1">
                رمز المصادقة
              </label>
              <input
                {...register2FA('token')}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-center tracking-widest"
                placeholder="xxxxxx"
                dir="ltr"
              />
              {twoFactorErrors.token && (
                <p className="mt-1 text-sm text-red-600">{twoFactorErrors.token.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || contextIsLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400"
            >
              {isLoading || contextIsLoading ? <Loader className="animate-spin h-5 w-5" /> : 'تحقق'}
            </button>
            <Button
              type="button"
              variant="link"
              onClick={() => {
                setRequires2FAInput(false);
                setUserIdFor2FA(null);
                setError(null); // Clear 2FA error on going back
              }}
              className="w-full mt-2"
            >
              العودة لتسجيل الدخول
            </Button>
          </form>
        </div>
      </PageWrapper>
    );
  }

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

        {displayError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{displayError}</p>
          </div>
        )}

        {debugInfo && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">{debugInfo}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmitLogin(handlePrimaryLogin)}>
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
                  {...registerLogin('email')}
                  type="email"
                  className="appearance-none rounded-lg relative block w-full pr-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="أدخل بريدك الإلكتروني"
                  dir="ltr"
                />
              </div>
              {loginErrors.email && (
                <p className="mt-1 text-sm text-red-600">{loginErrors.email.message}</p>
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
                  {...registerLogin('password')}
                  type="password"
                  className="appearance-none rounded-lg relative block w-full pr-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="أدخل كلمة المرور"
                />
              </div>
              {loginErrors.password && (
                <p className="mt-1 text-sm text-red-600">{loginErrors.password.message}</p>
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
            disabled={isLoading || contextIsLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {isLoading || contextIsLoading ? (
              <Loader className="animate-spin h-5 w-5" />
            ) : (
              'تسجيل الدخول'
            )}
          </button>

          {isDevelopment && loginAttempted && !requires2FAInput && (
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
