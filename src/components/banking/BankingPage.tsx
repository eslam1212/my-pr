import React, { useState } from 'react';
import { BankAccounts } from './BankAccounts';
import { Transactions } from './Transactions';
import { Reconciliation } from './Reconciliation';
import { Plus, FileText, RefreshCw } from 'lucide-react';

export function BankingPage() {
  const [activeTab, setActiveTab] = useState<'accounts' | 'transactions' | 'reconciliation'>('accounts');

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">إدارة البنوك</h1>
                <p className="mt-1 text-sm text-gray-600">
                  إدارة الحسابات البنكية والمعاملات والتسويات
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                  <Plus className="inline-block w-4 h-4 ml-1" />
                  إضافة حساب
                </button>
                <button className="flex-1 sm:flex-none px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                  <FileText className="inline-block w-4 h-4 ml-1" />
                  تصدير
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6">
          <div className="sm:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="accounts">الحسابات البنكية</option>
              <option value="transactions">المعاملات</option>
              <option value="reconciliation">التسويات</option>
            </select>
          </div>

          <div className="hidden sm:block">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 space-x-reverse" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('accounts')}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'accounts'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  الحسابات البنكية
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'transactions'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  المعاملات
                </button>
                <button
                  onClick={() => setActiveTab('reconciliation')}
                  className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'reconciliation'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  التسويات
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6">
              {activeTab === 'accounts' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">الحسابات البنكية</h2>
                    <button className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
                      <RefreshCw className="w-4 h-4 ml-1" />
                      تحديث
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <BankAccounts />
                  </div>
                </div>
              )}
              {activeTab === 'transactions' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">المعاملات</h2>
                    <button className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
                      <RefreshCw className="w-4 h-4 ml-1" />
                      تحديث
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <Transactions />
                  </div>
                </div>
              )}
              {activeTab === 'reconciliation' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">التسويات</h2>
                    <button className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
                      <RefreshCw className="w-4 h-4 ml-1" />
                      تحديث
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <Reconciliation />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
