import React, { useState, useMemo, useEffect } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plus, Edit, Trash2, X, Search, Filter, Download } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTransactions, getCategories, createTransaction, updateTransaction, deleteTransaction } from '@/lib/api';
import { Transaction, Category } from '@/types/database.types';
import { useToast } from '@/components/ui/use-toast';

export function RevenueManager() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedStatus, setSelectedStatus] = useState('الكل');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [transactionsData, categoriesData] = await Promise.all([
          getTransactions(),
          getCategories()
        ]);
        setTransactions(transactionsData.filter(t => t.type === 'income'));
        setCategories(categoriesData.filter(c => c.type === 'income'));
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

  const handleDeleteTransaction = async (id: number) => {
    try {
      await deleteTransaction(id);
      setTransactions(transactions.filter(t => t.id !== id));
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الإيراد بنجاح',
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف الإيراد',
        variant: 'destructive',
      });
    }
  };

  const handleAddTransaction = async (data: Partial<Transaction>) => {
    try {
      const newTransaction = await createTransaction({
        ...data,
        type: 'income',
        date: new Date().toISOString(),
      });
      setTransactions([...transactions, newTransaction]);
      setIsFormOpen(false);
      toast({
        title: 'تم الإضافة',
        description: 'تم إضافة الإيراد بنجاح',
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إضافة الإيراد',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateTransaction = async (data: Transaction) => {
    try {
      const updatedTransaction = await updateTransaction(data.id, data);
      setTransactions(transactions.map(t => t.id === data.id ? updatedTransaction : t));
      setIsFormOpen(false);
      setEditingTransaction(null);
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث الإيراد بنجاح',
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث الإيراد',
        variant: 'destructive',
      });
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = 
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'الكل' || transaction.category === selectedCategory;
      const matchesStatus = selectedStatus === 'الكل' || transaction.status === selectedStatus;
      
      const transactionDate = new Date(transaction.date);
      const startDate = dateRange.start ? new Date(dateRange.start) : null;
      const endDate = dateRange.end ? new Date(dateRange.end) : null;
      
      const matchesDateRange = 
        (!startDate || transactionDate >= startDate) &&
        (!endDate || transactionDate <= endDate);
      
      return matchesSearch && matchesCategory && matchesStatus && matchesDateRange;
    });
  }, [transactions, searchTerm, selectedCategory, selectedStatus, dateRange]);

  const chartData = useMemo(() => {
    const monthlyData = filteredTransactions.reduce((acc, transaction) => {
      const month = new Date(transaction.date).toLocaleString('ar-SA', { month: 'long' });
      if (!acc[month]) {
        acc[month] = { month, total: 0 };
      }
      acc[month].total += transaction.amount;
      return acc;
    }, {} as Record<string, { month: string; total: number }>);

    return Object.values(monthlyData);
  }, [filteredTransactions]);

  const totalRevenue = useMemo(() => {
    return filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  }, [filteredTransactions]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* أدوات التحكم */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
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
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="flex-1"
              />
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="flex-1"
              />
            </div>
            <Button onClick={() => setIsFormOpen(true)} className="w-full">
              <Plus className="w-4 h-4 ml-2" />
              إضافة إيراد جديد
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* الإحصائيات */}
      <Card>
        <CardHeader>
          <CardTitle>تحليل الإيرادات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                لا توجد بيانات للعرض
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value as number)}
                    labelFormatter={(label) => `شهر ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="total" name="الإيرادات" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* جدول المعاملات */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الإيرادات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الوصف</TableHead>
                  <TableHead>التصنيف</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      لا توجد إيرادات للعرض
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.date)}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.category}</TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          transaction.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.status === 'completed' ? 'مكتمل' : 'معلق'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTransaction(transaction);
                              setIsFormOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* نموذج إضافة/تحرير الإيراد */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>
                {editingTransaction ? 'تحرير الإيراد' : 'إضافة إيراد جديد'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                  description: formData.get('description') as string,
                  category: formData.get('category') as string,
                  amount: parseFloat(formData.get('amount') as string),
                  status: formData.get('status') as string,
                };

                if (editingTransaction) {
                  handleUpdateTransaction({ ...editingTransaction, ...data });
                } else {
                  handleAddTransaction(data);
                }
              }} className="space-y-4">
                <div>
                  <Input
                    name="description"
                    placeholder="وصف الإيراد"
                    defaultValue={editingTransaction?.description}
                    required
                  />
                </div>
                <div>
                  <Select name="category" defaultValue={editingTransaction?.category}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Input
                    name="amount"
                    type="number"
                    placeholder="المبلغ"
                    defaultValue={editingTransaction?.amount}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Select name="status" defaultValue={editingTransaction?.status || 'pending'}>
                    <SelectTrigger>
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">مكتمل</SelectItem>
                      <SelectItem value="pending">معلق</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="submit">
                    {editingTransaction ? 'تحديث' : 'إضافة'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingTransaction(null);
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
