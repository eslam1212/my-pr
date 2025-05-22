import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Loader2, Download, Filter, RefreshCw, Plus, Edit, Trash2 } from 'lucide-react';
import { getTransactions, getCategories, deleteTransaction } from '@/lib/api';
import { checkConnection, initializeData } from '@/lib/supabase';
import { Transaction, Category } from '@/types/database.types';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionForm } from './TransactionForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function FinancePage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [view, setView] = useState<'monthly' | 'daily'>('monthly');
  const [activeTab, setActiveTab] = useState('overview');
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      setError(null);
      
      // التحقق من الاتصال بقاعدة البيانات أولاً
      const isConnected = await checkConnection();
      if (!isConnected) {
        throw new Error('فشل الاتصال بقاعدة البيانات');
      }
      
      // تهيئة البيانات الأولية إذا لزم الأمر
      await initializeData();

      // تحميل البيانات
      const [transactionsData, categoriesData] = await Promise.all([
        getTransactions().catch(err => {
          console.error('Error fetching transactions:', err);
          return [];
        }),
        getCategories().catch(err => {
          console.error('Error fetching categories:', err);
          return [];
        })
      ]);

      setTransactions(transactionsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof Error ? error.message : 'حدث خطأ أثناء تحميل البيانات');
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء تحميل البيانات',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshData() {
    try {
      setIsRefreshing(true);
      setError(null);
      await loadData();
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث البيانات بنجاح',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError(error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث البيانات');
      toast({
        title: 'خطأ',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث البيانات',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  }

  const handleAddTransaction = () => {
    setSelectedTransaction(undefined);
    setIsTransactionFormOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionFormOpen(true);
  };

  const handleDeleteTransaction = (id: number) => {
    setTransactionToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (transactionToDelete) {
      try {
        await deleteTransaction(transactionToDelete);
        toast({
          title: 'تم الحذف',
          description: 'تم حذف المعاملة بنجاح',
        });
        refreshData();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        toast({
          title: 'خطأ',
          description: 'حدث خطأ أثناء حذف المعاملة',
          variant: 'destructive',
        });
      } finally {
        setIsDeleteDialogOpen(false);
        setTransactionToDelete(null);
      }
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesCategory = selectedCategory === 'الكل' || transaction.category === selectedCategory;
      
      if (!startDate && !endDate) return matchesCategory;
      
      const transactionDate = new Date(transaction.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && end) {
        return matchesCategory && transactionDate >= start && transactionDate <= end;
      } else if (start) {
        return matchesCategory && transactionDate >= start;
      } else if (end) {
        return matchesCategory && transactionDate <= end;
      }
      return matchesCategory;
    });
  }, [transactions, startDate, endDate, selectedCategory]);

  const totalRevenue = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalExpenses = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [filteredTransactions]);

  const netProfit = useMemo(() => {
    return totalRevenue - totalExpenses;
  }, [totalRevenue, totalExpenses]);

  const monthlyData = useMemo(() => {
    const data: Record<string, { income: number; expenses: number; profit: number }> = {};
    
    filteredTransactions.forEach(transaction => {
      const month = new Date(transaction.date).toLocaleString('ar-SA', { month: 'long' });
      if (!data[month]) {
        data[month] = { income: 0, expenses: 0, profit: 0 };
      }
      
      const amount = Math.abs(transaction.amount);
      if (transaction.type === 'income') {
        data[month].income += amount;
      } else {
        data[month].expenses += amount;
      }
      data[month].profit = data[month].income - data[month].expenses;
    });

    return Object.entries(data).map(([month, values]) => ({
      month,
      ...values
    }));
  }, [filteredTransactions]);

  const stats = [
    {
      title: 'إجمالي الإيرادات',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: 'text-green-600 bg-green-100'
    },
    {
      title: 'إجمالي المصروفات',
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      color: 'text-red-600 bg-red-100'
    },
    {
      title: 'صافي الربح',
      value: formatCurrency(netProfit),
      icon: TrendingUp,
      color: `${netProfit >= 0 ? 'text-blue-600 bg-blue-100' : 'text-red-600 bg-red-100'}`
    },
    {
      title: 'عدد المعاملات',
      value: filteredTransactions.length.toLocaleString('ar-SA'),
      icon: Wallet,
      color: 'text-purple-600 bg-purple-100'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-gray-600">جاري تحميل البيانات...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <div className="text-red-600 text-center">
          <p className="text-lg font-semibold mb-2">حدث خطأ</p>
          <p className="text-sm">{error}</p>
        </div>
        <Button onClick={refreshData} disabled={isRefreshing}>
          {isRefreshing ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جاري المحاولة...
            </>
          ) : (
            'إعادة المحاولة'
          )}
        </Button>
      </div>
    );
  }

  const handleExportData = () => {
    const csvContent = [
      ['التاريخ', 'الوصف', 'التصنيف', 'النوع', 'المبلغ'].join(','),
      ...filteredTransactions.map(t => [
        formatDate(t.date),
        t.description,
        t.category,
        t.type === 'income' ? 'دخل' : 'مصروف',
        t.amount
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `finance_report_${formatDate(new Date())}.csv`;
    link.click();
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم المالية</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={refreshData} disabled={isRefreshing} className="text-sm">
            <RefreshCw className={`w-4 h-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          <Button variant="outline" onClick={handleExportData} className="text-sm">
            <Download className="w-4 h-4 ml-2" />
            تصدير
          </Button>
          <Button onClick={handleAddTransaction} className="text-sm">
            <Plus className="w-4 h-4 ml-2" />
            إضافة معاملة
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="mr-3 flex-1">
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="التصنيف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="الكل">الكل</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-[150px]"
                placeholder="من تاريخ"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-[150px]"
                placeholder="إلى تاريخ"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Different Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="transactions">المعاملات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">تحليل الإيرادات والمصروفات الشهري</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {monthlyData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      لا توجد بيانات للعرض
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={monthlyData}
                        margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip 
                          formatter={(value) => formatCurrency(value as number)}
                          labelFormatter={(label) => `شهر ${label}`}
                        />
                        <Legend />
                        <Bar dataKey="income" name="الإيرادات" fill="#10B981" />
                        <Bar dataKey="expenses" name="المصروفات" fill="#EF4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">تحليل صافي الربح</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  {monthlyData.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      لا توجد بيانات للعرض
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={monthlyData}
                        margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip 
                          formatter={(value) => formatCurrency(value as number)}
                          labelFormatter={(label) => `شهر ${label}`}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="profit" 
                          name="صافي الربح"
                          stroke="#6366F1"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          {/* Transactions Table */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">المعاملات المالية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th scope="col" className="py-3 px-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                        <th scope="col" className="py-3 px-3 text-right text-xs font-medium text-gray-500 uppercase">الوصف</th>
                        <th scope="col" className="py-3 px-3 text-right text-xs font-medium text-gray-500 uppercase">التصنيف</th>
                        <th scope="col" className="py-3 px-3 text-right text-xs font-medium text-gray-500 uppercase">النوع</th>
                        <th scope="col" className="py-3 px-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ</th>
                        <th scope="col" className="py-3 px-3 text-center text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-gray-500">
                            لا توجد معاملات مالية
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="py-2 px-3 text-sm text-gray-900">{formatDate(transaction.date)}</td>
                            <td className="py-2 px-3 text-sm text-gray-900">{transaction.description}</td>
                            <td className="py-2 px-3 text-sm text-gray-900">{transaction.category}</td>
                            <td className="py-2 px-3 text-sm">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                transaction.type === 'income' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {transaction.type === 'income' ? 'دخل' : 'مصروف'}
                              </span>
                            </td>
                            <td className={`py-2 px-3 text-sm font-medium ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(Math.abs(transaction.amount))}
                            </td>
                            <td className="py-2 px-3 text-sm text-gray-900">
                              <div className="flex justify-center gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditTransaction(transaction)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteTransaction(transaction.id)}
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transaction Form Dialog */}
      <TransactionForm 
        isOpen={isTransactionFormOpen}
        onClose={() => setIsTransactionFormOpen(false)}
        onSuccess={refreshData}
        transaction={selectedTransaction}
        categories={categories}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذه المعاملة؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف المعاملة نهائيًا من قاعدة البيانات.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
