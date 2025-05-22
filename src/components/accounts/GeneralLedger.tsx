import React, { useState, useMemo, useEffect } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Search, Download, Filter, Plus } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getTransactions, getCategories } from '@/lib/api';
import { Transaction, Category } from '@/types/database.types';
import { useToast } from '@/components/ui/use-toast';

export function GeneralLedger() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [transactionsData, categoriesData] = await Promise.all([
          getTransactions(),
          getCategories()
        ]);
        setTransactions(transactionsData);
        setCategories(categoriesData);
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
    loadData();
  }, [toast]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = 
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase());
      
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

  const chartData = useMemo(() => {
    return transactions.map(t => ({
      date: formatDate(t.date),
      debit: t.type === 'expense' ? t.amount : 0,
      credit: t.type === 'income' ? t.amount : 0,
      balance: t.type === 'income' ? t.amount : -t.amount
    }));
  }, [transactions]);

  const totalDebit = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const totalCredit = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* أدوات التحكم */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="بحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الحساب" />
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
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="text-right"
          />
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="text-right"
          />
        </div>
        <div className="flex justify-between mt-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 ml-2" />
              تصفية متقدمة
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 ml-2" />
              تصدير
            </Button>
          </div>
          <Button size="sm">
            <Plus className="h-4 w-4 ml-2" />
            إضافة معاملة
          </Button>
        </div>
      </div>

      {/* الرسم البياني */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <h3 className="text-lg font-semibold mb-4">تحليل المعاملات</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="debit" stroke="#EF4444" name="مدين" />
              <Line type="monotone" dataKey="credit" stroke="#10B981" name="دائن" />
              <Line type="monotone" dataKey="balance" stroke="#6366F1" name="الرصيد" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* جدول المعاملات */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">سجل المعاملات</h3>
            <div className="flex gap-4">
              <div className="text-sm">
                <span className="text-gray-500">إجمالي المدين:</span>
                <span className="font-semibold mr-1 text-red-600">{formatCurrency(totalDebit)}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">إجمالي الدائن:</span>
                <span className="font-semibold mr-1 text-green-600">{formatCurrency(totalCredit)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>رقم المرجع</TableHead>
                <TableHead>الحساب</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>مدين</TableHead>
                <TableHead>دائن</TableHead>
                <TableHead>الرصيد</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => {
                const isDebit = transaction.type === 'expense';
                return (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>{transaction.reference || '-'}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell className="text-red-600">
                      {isDebit ? formatCurrency(transaction.amount) : '-'}
                    </TableCell>
                    <TableCell className="text-green-600">
                      {!isDebit ? formatCurrency(transaction.amount) : '-'}
                    </TableCell>
                    <TableCell className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(Math.abs(transaction.amount))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
