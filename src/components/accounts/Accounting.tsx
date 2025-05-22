import React, { useState, useEffect } from 'react';
import { GeneralLedger } from './GeneralLedger';
import { ExpenseManager } from './ExpenseManager';
import { RevenueManager } from './RevenueManager';
import { BudgetPlanner } from './BudgetPlanner';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { ArrowUpIcon, ArrowDownIcon, DollarSign, TrendingUp, Wallet, ArrowLeftRight } from 'lucide-react';
import { PageWrapper } from '../layout/PageWrapper';

interface AccountingStats {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  transactions: number;
  revenueChange: number;
  expensesChange: number;
  netIncomeChange: number;
  transactionsChange: number;
}

export function Accounting() {
  const { toast } = useToast();
  const [stats, setStats] = useState<AccountingStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    transactions: 0,
    revenueChange: 0,
    expensesChange: 0,
    netIncomeChange: 0,
    transactionsChange: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccountingData = async () => {
      try {
        setIsLoading(true);
        // Simulating API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        setStats({
          totalRevenue: 120000,
          totalExpenses: 85000,
          netIncome: 35000,
          transactions: 156,
          revenueChange: 12.5,
          expensesChange: 8.2,
          netIncomeChange: 15.3,
          transactionsChange: 5.7
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching accounting data:', err);
        setError('حدث خطأ أثناء جلب بيانات المحاسبة. يرجى المحاولة مرة أخرى.');
        toast({
          title: "خطأ",
          description: "فشل في تحميل بيانات المحاسبة",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccountingData();
  }, [toast]);

  if (error) {
    return (
      <PageWrapper className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h2 className="text-red-800 font-semibold">خطأ في النظام</h2>
          <p className="text-red-600">{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
            onClick={() => window.location.reload()}
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      </PageWrapper>
    );
  }

  if (isLoading) {
    return (
      <PageWrapper className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          إدارة الحسابات
        </h1>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            تصدير التقرير
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            طباعة
          </button>
        </div>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <div className="flex items-center pt-1">
              {stats.revenueChange >= 0 ? (
                <ArrowUpIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-xs ${stats.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'} mr-1`}>
                {stats.revenueChange >= 0 ? '+' : ''}{stats.revenueChange}%
              </span>
              <span className="text-xs text-gray-500 mr-1">من الشهر الماضي</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">إجمالي المصروفات</CardTitle>
            <Wallet className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
            <div className="flex items-center pt-1">
              {stats.expensesChange <= 0 ? (
                <ArrowDownIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowUpIcon className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-xs ${stats.expensesChange <= 0 ? 'text-green-500' : 'text-red-500'} mr-1`}>
                {stats.expensesChange <= 0 ? '' : '+'}{stats.expensesChange}%
              </span>
              <span className="text-xs text-gray-500 mr-1">من الشهر الماضي</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">صافي الدخل</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.netIncome)}</div>
            <div className="flex items-center pt-1">
              {stats.netIncomeChange >= 0 ? (
                <ArrowUpIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-xs ${stats.netIncomeChange >= 0 ? 'text-green-500' : 'text-red-500'} mr-1`}>
                {stats.netIncomeChange >= 0 ? '+' : ''}{stats.netIncomeChange}%
              </span>
              <span className="text-xs text-gray-500 mr-1">من الشهر الماضي</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">عدد المعاملات</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transactions}</div>
            <div className="flex items-center pt-1">
              {stats.transactionsChange >= 0 ? (
                <ArrowUpIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownIcon className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-xs ${stats.transactionsChange >= 0 ? 'text-green-500' : 'text-red-500'} mr-1`}>
                {stats.transactionsChange >= 0 ? '+' : ''}{stats.transactionsChange}%
              </span>
              <span className="text-xs text-gray-500 mr-1">من الشهر الماضي</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ledger" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="ledger">دفتر الحسابات</TabsTrigger>
          <TabsTrigger value="expenses">المصروفات</TabsTrigger>
          <TabsTrigger value="revenue">الإيرادات</TabsTrigger>
          <TabsTrigger value="budget">الميزانية</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <GeneralLedger apiUrl="/api/accounting/ledger" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <ExpenseManager apiUrl="/api/accounting/expenses" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <RevenueManager apiUrl="/api/accounting/revenue" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <BudgetPlanner apiUrl="/api/accounting/budget" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}