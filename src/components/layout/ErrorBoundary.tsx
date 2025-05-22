import React from 'react';
import { useRouteError } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';

export function ErrorBoundary() {
  const error = useRouteError() as any;
  console.error('Application Error:', error);
  
  // Get direction from settings store
  const { direction } = useSettingsStore.getState();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8" dir={direction}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
            عذراً، حدث خطأ
          </h2>
          <div className="mt-4">
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    تفاصيل الخطأ
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      {error?.message || 'حدث خطأ غير متوقع في التطبيق'}
                    </p>
                    {error?.stack && (
                      <pre className="mt-2 text-xs overflow-auto">
                        {error.stack}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={() => window.location.reload()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
