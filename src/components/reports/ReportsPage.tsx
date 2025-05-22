import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Download, Filter, Plus, Search, Calendar, Printer, Loader2 } from 'lucide-react';
import { getTransactions, getCategories, getReports, createReport, createTransaction, updateTransaction, deleteTransaction } from '@/lib/api';
import { Transaction, Category, Report } from '@/types/database.types';
import { useToast } from '@/components/ui/use-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function ReportsPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [view, setView] = useState<'list' | 'chart'>('list');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      const [transactionsData, categoriesData, reportsData] = await Promise.all([
        getTransactions(),
        getCategories(),
        getReports()
      ]);
      setTransactions(transactionsData);
      setCategories(categoriesData);
      setReports(reportsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحميل البيانات',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = 
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'الكل' || transaction.category === selectedCategory;
      
      const transactionDate = new Date(transaction.date);
      const startDate = dateRange.start ? new Date(dateRange.start) : null;
      const endDate = dateRange.end ? new Date(dateRange.end) : null;
      
      const matchesDateRange = 
        (!startDate || transactionDate >= startDate) &&
        (!endDate || transactionDate <= endDate);

      return matchesSearch && matchesCategory && matchesDateRange;
    });
  }, [transactions, searchTerm, selectedCategory, dateRange]);

  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalExpenses = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [filteredTransactions]);

  const categoryData = useMemo(() => {
    const data: { [key: string]: number } = {};
    filteredTransactions.forEach(t => {
      if (t.type === 'expense') {
        data[t.category] = (data[t.category] || 0) + Math.abs(t.amount);
      }
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const handleGenerateReport = async () => {
    try {
      setIsSubmitting(true);
      const newReport = {
        title: `تقرير ${selectedCategory === 'الكل' ? 'شامل' : selectedCategory} - ${formatDate(new Date())}`,
        type: 'expense' as 'income' | 'expense' | 'budget',
        description: `تقرير مالي للفترة من ${dateRange.start || 'البداية'} إلى ${dateRange.end || 'النهاية'}`,
        date_range: {
          start: dateRange.start || new Date().toISOString().split('T')[0],
          end: dateRange.end || new Date().toISOString().split('T')[0]
        },
        data: {
          transactions: filteredTransactions,
          summary: {
            total_income: totalIncome,
            total_expenses: totalExpenses,
            net_profit: totalIncome - totalExpenses,
            categories: categoryData
          }
        },
        user_id: 'system'
      };

      const createdReport = await createReport(newReport);
      setReports([createdReport, ...reports]);
      
      toast({
        title: 'تم إنشاء التقرير',
        description: 'تم إنشاء التقرير بنجاح',
      });
    } catch (error) {
      console.error('Error creating report:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إنشاء التقرير',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">إجمالي الدخل</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 rtl">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">إجمالي المصروفات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 rtl">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">صافي الربح</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold rtl ${totalIncome - totalExpenses >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(totalIncome - totalExpenses)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4"
                dir="rtl"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[180px]">
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
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="pl-10 w-full sm:w-[150px]"
                  placeholder="من تاريخ"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="pl-10 w-full sm:w-[150px]"
                  placeholder="إلى تاريخ"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            onClick={() => setView('list')}
            className="px-4"
          >
            قائمة
          </Button>
          <Button
            variant={view === 'chart' ? 'default' : 'outline'}
            onClick={() => setView('chart')}
            className="px-4"
          >
            رسم بياني
          </Button>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={handleGenerateReport} 
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الإنشاء...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 ml-2" />
                إنشاء تقرير
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={handlePrint}
            className="w-full sm:w-auto"
          >
            <Printer className="w-4 h-4 ml-2" />
            طباعة
          </Button>
        </div>
      </div>

      {/* Content */}
      {view === 'list' ? (
        <Card className="shadow-sm">
          <div className="overflow-x-auto rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-medium text-gray-500">التاريخ</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">الوصف</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">التصنيف</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">النوع</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      لا توجد معاملات مالية
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="py-3">{formatDate(transaction.date)}</TableCell>
                      <TableCell className="py-3">{transaction.description}</TableCell>
                      <TableCell className="py-3">{transaction.category}</TableCell>
                      <TableCell className="py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.type === 'income' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type === 'income' ? 'دخل' : 'مصروف'}
                        </span>
                      </TableCell>
                      <TableCell className={`py-3 font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(Math.abs(transaction.amount))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">توزيع المصروفات حسب التصنيف</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center text-gray-500">
                  لا توجد بيانات للعرض
                </div>
              ) : (
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        innerRadius={60}
                        paddingAngle={2}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                            stroke="white"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend layout="vertical" verticalAlign="middle" align="right" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">تحليل الدخل والمصروفات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={[
                      { name: 'الدخل', amount: totalIncome, fill: '#10B981' },
                      { name: 'المصروفات', amount: totalExpenses, fill: '#EF4444' },
                      { name: 'صافي الربح', amount: totalIncome - totalExpenses, fill: '#6366F1' }
                    ]}
                    margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Bar 
                      dataKey="amount" 
                      radius={[4, 4, 0, 0]} 
                      fill="#8884d8" 
                      barSize={60}
                    >
                      {[
                        { name: 'الدخل', fill: '#10B981' },
                        { name: 'المصروفات', fill: '#EF4444' },
                        { name: 'صافي الربح', fill: '#6366F1' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Print Section - Hidden until print */}
      <div className="hidden print:block mt-8">
        <h1 className="text-2xl font-bold mb-4 text-center">
          تقرير {selectedCategory === 'الكل' ? 'شامل' : selectedCategory} - {formatDate(new Date())}
        </h1>
        <p className="mb-6 text-center">
          تقرير مالي للفترة من {dateRange.start || 'البداية'} إلى {dateRange.end || 'النهاية'}
        </p>
        
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border p-4 rounded">
            <h2 className="font-bold mb-2">إجمالي الدخل</h2>
            <p className="text-xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="border p-4 rounded">
            <h2 className="font-bold mb-2">إجمالي المصروفات</h2>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="border p-4 rounded">
            <h2 className="font-bold mb-2">صافي الربح</h2>
            <p className={`text-xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(totalIncome - totalExpenses)}
            </p>
          </div>
        </div>
        
        <table className="w-full border-collapse mb-8">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-right">التاريخ</th>
              <th className="border p-2 text-right">الوصف</th>
              <th className="border p-2 text-right">التصنيف</th>
              <th className="border p-2 text-right">النوع</th>
              <th className="border p-2 text-right">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="border p-2">{formatDate(transaction.date)}</td>
                <td className="border p-2">{transaction.description}</td>
                <td className="border p-2">{transaction.category}</td>
                <td className="border p-2">
                  {transaction.type === 'income' ? 'دخل' : 'مصروف'}
                </td>
                <td className={`border p-2 ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(transaction.amount))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="text-center text-sm text-gray-500 mt-8">
          تم إنشاء هذا التقرير في {formatDate(new Date())}
        </div>
      </div>
    </div>
  );
}
