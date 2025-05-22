import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { formatCurrency, formatDate } from '../../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { ArrowDown, ArrowUp, DollarSign, TrendingUp, TrendingDown, Activity, AlertTriangle, RefreshCw } from 'lucide-react';
import { getTransactions, getCategories, getBudgets } from '../../lib/api';
import { Transaction, Category, Budget } from '../../types/database.types';
import { useToast } from '../../components/ui/use-toast';
import { Button } from '../../components/ui/button';
import { initializeData } from '../../lib/supabase';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function DashboardPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [needsDbSetup, setNeedsDbSetup] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  async function loadData() {
    try {
      setIsLoading(true);
      setHasError(false);

      let transactionsData = [], categoriesData = [], budgetsData = [];

      try {
        transactionsData = await getTransactions();
      } catch (error: any) {
        console.error('Error fetching transactions:', error);
        if (error?.code === '42501') { // Permission denied error
          setNeedsDbSetup(true);
        }
      }

      try {
        categoriesData = await getCategories();
      } catch (error: any) {
        console.error('Error fetching categories:', error);
        if (error?.code === '42501') { // Permission denied error
          setNeedsDbSetup(true);
        }
      }

      try {
        budgetsData = await getBudgets();
      } catch (error: any) {
        console.error('Error fetching budgets:', error);
        if (error?.code === '42501') { // Permission denied error
          setNeedsDbSetup(true);
        }
      }

      setTransactions(transactionsData);
      setCategories(categoriesData);
      setBudgets(budgetsData);

      // تحقق ما إذا كانت جميع البيانات فارغة، قد يشير ذلك إلى أن جداول قاعدة البيانات غير موجودة
      if (
        Array.isArray(transactionsData) && transactionsData.length === 0 &&
        Array.isArray(categoriesData) && categoriesData.length === 0 &&
        Array.isArray(budgetsData) && budgetsData.length === 0
      ) {
        setNeedsDbSetup(true);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setHasError(true);
      setNeedsDbSetup(true);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحميل البيانات',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [toast]);

  // إعداد قاعدة البيانات واستدعاء وظيفة RPC لتهيئة الجداول
  const setupDatabase = async () => {
    try {
      setIsInitializing(true);

      // First, check if we have a valid session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        toast({
          title: 'تحذير',
          description: 'يجب تسجيل الدخول أولاً قبل تهيئة قاعدة البيانات',
          variant: 'destructive',
        });
        return;
      }

      // Force token refresh to ensure we have a fresh token
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn('Token refresh failed:', refreshError);
          toast({
            title: 'تحذير',
            description: 'فشل تحديث رمز المصادقة. قد تواجه مشاكل في الوصول إلى البيانات',
            variant: 'destructive',
          });
        } else if (refreshData?.session) {
          localStorage.setItem('supabase_access_token', refreshData.session.access_token);
          localStorage.setItem('last_token_refresh_time', Date.now().toString());
          console.log('Token refreshed successfully before database initialization');
        }
      } catch (refreshError) {
        console.warn('Error during token refresh:', refreshError);
      }

      // Initialize the database
      const success = await initializeData();

      if (success) {
        toast({
          title: 'تم بنجاح',
          description: 'تم تهيئة قاعدة البيانات بنجاح، جاري تحميل البيانات',
        });

        // Try to load data
        try {
          await loadData();

          // Check if we still have permission issues
          if (needsDbSetup) {
            toast({
              title: 'تحذير',
              description: 'تم إنشاء الجداول ولكن لا يزال هناك مشكلة في سياسات الأمان (RLS)',
              variant: 'destructive',
            });

            toast({
              title: 'تعليمات',
              description: 'قم بتنفيذ ملف emergency_rls_fix.sql في محرر SQL في لوحة تحكم Supabase',
            });
          }
        } catch (error) {
          console.error('Error loading data after database setup:', error);
        }
      } else {
        toast({
          title: 'تحذير',
          description: 'قد تكون هناك مشكلة في تهيئة قاعدة البيانات. تحقق من وجود وظيفة RPC في قاعدة البيانات',
          variant: 'destructive',
        });

        // Show instructions for manual setup
        toast({
          title: 'تعليمات',
          description: 'قم بتنفيذ ملف emergency_rls_fix.sql في محرر SQL في لوحة تحكم Supabase',
        });
      }
    } catch (error) {
      console.error('Error setting up database:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تهيئة قاعدة البيانات',
        variant: 'destructive',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalBudget = useMemo(() => {
    return budgets.reduce((sum, b) => sum + b.amount, 0);
  }, [budgets]);

  const totalSpent = useMemo(() => {
    return budgets.reduce((sum, b) => sum + b.spent, 0);
  }, [budgets]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const data: Record<string, { income: number; expenses: number }> = {};

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!data[monthYear]) {
        data[monthYear] = { income: 0, expenses: 0 };
      }

      if (transaction.type === 'income') {
        data[monthYear].income += transaction.amount;
      } else {
        data[monthYear].expenses += transaction.amount;
      }
    });

    return Object.entries(data)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amounts]) => ({
        date,
        ...amounts,
        profit: amounts.income - amounts.expenses
      }));
  }, [transactions]);

  const categoryData = useMemo(() => {
    const data: Record<string, { income: number; expenses: number }> = {};

    transactions.forEach(transaction => {
      if (!data[transaction.category]) {
        data[transaction.category] = { income: 0, expenses: 0 };
      }

      if (transaction.type === 'income') {
        data[transaction.category].income += transaction.amount;
      } else {
        data[transaction.category].expenses += transaction.amount;
      }
    });

    return Object.entries(data).map(([category, amounts]) => ({
      category,
      ...amounts
    }));
  }, [transactions]);

  const pieData = useMemo(() => {
    return categories.map(category => ({
      name: category.name,
      value: transactions
        .filter(t => t.category === category.name && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
    })).filter(item => item.value > 0);
  }, [transactions, categories]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">جاري التحميل...</div>;
  }

  if (needsDbSetup) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">تحتاج إلى إعداد قاعدة البيانات</h2>
        <p className="text-gray-600 mb-4">
          يبدو أن هناك مشكلة في الوصول إلى جداول قاعدة البيانات. يمكن أن يكون سبب ذلك:
        </p>
        <ol className="text-right list-decimal mb-4 max-w-lg">
          <li className="mb-2">جداول قاعدة البيانات غير موجودة بعد</li>
          <li className="mb-2">سياسات الأمان (RLS) غير مكونة بشكل صحيح</li>
          <li className="mb-2">مشكلة في الاتصال بقاعدة البيانات</li>
          <li className="mb-2">وظيفة RPC <code>create_required_tables</code> غير موجودة</li>
        </ol>
        <div className="flex flex-col gap-4 mt-4">
          <Button
            variant="default"
            onClick={setupDatabase}
            disabled={isInitializing}
            className="flex items-center gap-2"
          >
            {isInitializing ? 'جاري التهيئة...' : 'تهيئة قاعدة البيانات'}
            {isInitializing && <RefreshCw className="h-4 w-4 animate-spin" />}
          </Button>
          <Button
            variant="outline"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            إعادة تحميل البيانات
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="mt-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-200 max-w-lg">
          <h3 className="font-bold mb-2">خطوات الإصلاح اليدوي:</h3>
          <ol className="text-right list-decimal pl-5">
            <li className="mb-2">تأكد من تسجيل الدخول بحساب صالح</li>
            <li className="mb-2">انتقل إلى لوحة تحكم Supabase وافتح محرر SQL</li>
            <li className="mb-2 font-bold text-red-600">قم بتنفيذ ملف <code>emergency_rls_fix.sql</code> الموجود في مجلد المشروع</li>
            <li className="mb-2">تأكد من تفعيل سياسات الأمان (RLS) لكل الجداول</li>
            <li className="mb-2">عد إلى التطبيق واضغط على "إعادة تحميل البيانات"</li>
          </ol>
          <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="font-bold text-yellow-800">ملاحظة مهمة:</p>
            <p className="text-yellow-800">
              يبدو أن هناك مشكلة في سياسات الأمان (RLS). تم إنشاء الجداول بنجاح ولكن لا يمكن الوصول إليها بسبب سياسات الأمان.
            </p>
            <p className="mt-2 text-yellow-800 font-bold">
              جرب تنفيذ الملفات بالترتيب التالي حتى تحل المشكلة:
              <ol className="list-decimal mr-5 mt-1">
                <li><code>disable_all_rls.sql</code> (تعطيل RLS تماماً)</li>
                <li><code>reset_all_rls.sql</code> (إعادة ضبط سياسات RLS)</li>
                <li><code>recreate_tables.sql</code> (إعادة إنشاء الجداول)</li>
                <li><code>full_reset.sql</code> (إعادة ضبط كاملة لقاعدة البيانات - استخدم هذا كحل أخير)</li>
              </ol>
            </p>
            <p className="mt-2 text-red-600 font-bold">
              ملاحظة مهمة: الملف الأخير <code>full_reset.sql</code> سيحذف جميع البيانات الموجودة في قاعدة البيانات!
            </p>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            ملاحظة: إذا استمرت المشكلة، تحقق من سجلات الأخطاء في وحدة تحكم المتصفح للحصول على مزيد من المعلومات.
          </p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">حدث خطأ</h2>
        <p className="text-gray-600 mb-4">
          لم نتمكن من تحميل البيانات. يرجى المحاولة مرة أخرى.
        </p>
        <Button
          onClick={loadData}
          variant="default"
          className="flex items-center gap-2"
        >
          إعادة المحاولة
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
            <div className="flex items-center pt-1">
              <ArrowUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-gray-500 ml-1">+12.5% من الشهر الماضي</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">إجمالي المصروفات</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
            <div className="flex items-center pt-1">
              <ArrowDown className="h-4 w-4 text-red-500" />
              <span className="text-xs text-gray-500 ml-1">-8.3% من الشهر الماضي</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">صافي الربح</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalIncome - totalExpenses)}
            </div>
            <div className="flex items-center pt-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-gray-500 ml-1">+15.2% من الشهر الماضي</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">نسبة الإنفاق من الميزانية</CardTitle>
            <Activity className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}%` : '0%'}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div
                className={`h-2.5 rounded-full ${
                  (totalSpent / totalBudget) > 1 ? 'bg-red-600' :
                  (totalSpent / totalBudget) > 0.8 ? 'bg-yellow-400' :
                  'bg-green-600'
                }`}
                style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>تحليل الإيرادات والمصروفات الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#10B981" name="الإيرادات" />
                  <Line type="monotone" dataKey="expenses" stroke="#EF4444" name="المصروفات" />
                  <Line type="monotone" dataKey="profit" stroke="#6366F1" name="صافي الربح" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع المصروفات حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.name} (${formatCurrency(entry.value)})`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* آخر المعاملات */}
      <Card>
        <CardHeader>
          <CardTitle>آخر المعاملات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full ${transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'} mr-2`} />
                  <div>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-sm text-gray-500">{transaction.category}</div>
                  </div>
                </div>
                <div>
                  <div className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </div>
                  <div className="text-sm text-gray-500">{formatDate(transaction.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
