import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Download, Filter, Plus, Search, Edit, Trash2 } from 'lucide-react';
import { getBudgets, getCategories, createBudget, updateBudget, deleteBudget } from '@/lib/api';
import { Budget, Category } from '@/types/database.types';
import { useToast } from '@/components/ui/use-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function BudgetPlanner() {
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [selectedStatus, setSelectedStatus] = useState('الكل');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const [budgetsData, categoriesData] = await Promise.all([
          getBudgets(),
          getCategories()
        ]);
        setBudgets(budgetsData);
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

  const handleCreateBudget = async () => {
    try {
      const newBudget = {
        category: selectedCategory,
        amount: 0,
        spent: 0,
        start_date: dateRange.start,
        end_date: dateRange.end,
        status: 'active'
      };

      const createdBudget = await createBudget(newBudget);
      setBudgets([...budgets, createdBudget]);
      
      toast({
        title: 'تم إنشاء الميزانية',
        description: 'تم إنشاء الميزانية بنجاح',
      });
    } catch (error) {
      console.error('Error creating budget:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إنشاء الميزانية',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBudget = async (id: number) => {
    try {
      await deleteBudget(id);
      setBudgets(budgets.filter(b => b.id !== id));
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الميزانية بنجاح',
      });
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف الميزانية',
        variant: 'destructive',
      });
    }
  };

  const filteredBudgets = useMemo(() => {
    return budgets.filter(budget => {
      const matchesSearch = 
        budget.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'الكل' || budget.category === selectedCategory;
      const matchesStatus = selectedStatus === 'الكل' || budget.status === selectedStatus;
      
      const budgetStartDate = new Date(budget.start_date);
      const budgetEndDate = new Date(budget.end_date);
      const startDate = dateRange.start ? new Date(dateRange.start) : null;
      const endDate = dateRange.end ? new Date(dateRange.end) : null;
      
      const matchesDateRange = 
        (!startDate || budgetEndDate >= startDate) &&
        (!endDate || budgetStartDate <= endDate);
      
      return matchesSearch && matchesCategory && matchesStatus && matchesDateRange;
    });
  }, [budgets, searchTerm, selectedCategory, selectedStatus, dateRange]);

  const totalBudget = useMemo(() => {
    return filteredBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  }, [filteredBudgets]);

  const totalSpent = useMemo(() => {
    return filteredBudgets.reduce((sum, budget) => sum + budget.spent, 0);
  }, [filteredBudgets]);

  const categoryData = useMemo(() => {
    const data: Record<string, { budget: number; spent: number }> = {};
    
    filteredBudgets.forEach(budget => {
      if (!data[budget.category]) {
        data[budget.category] = { budget: 0, spent: 0 };
      }
      data[budget.category].budget += budget.amount;
      data[budget.category].spent += budget.spent;
    });

    return Object.entries(data).map(([category, amounts]) => ({
      category,
      ...amounts
    }));
  }, [filteredBudgets]);

  const pieData = useMemo(() => {
    return categories.map(category => ({
      name: category.name,
      value: filteredBudgets
        .filter(b => b.category === category.name)
        .reduce((sum, b) => sum + b.amount, 0)
    })).filter(item => item.value > 0);
  }, [filteredBudgets, categories]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">إجمالي الميزانية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">إجمالي المصروف</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">المتبقي</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalBudget - totalSpent)}
            </div>
          </CardContent>
        </Card>
      </div>

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
                className="pr-9"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الفئة" />
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
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="اختر الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="الكل">الكل</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
                <SelectItem value="cancelled">ملغي</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
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
            <Button size="sm" onClick={handleCreateBudget}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة ميزانية
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>تحليل الميزانية والمصروفات حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="budget" fill="#10B981" name="الميزانية" />
                  <Bar dataKey="spent" fill="#EF4444" name="المصروف" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع الميزانية حسب الفئة</CardTitle>
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

      {/* جدول الميزانيات */}
      <Card>
        <CardHeader>
          <CardTitle>الميزانيات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الفئة</TableHead>
                  <TableHead>الميزانية</TableHead>
                  <TableHead>المصروف</TableHead>
                  <TableHead>المتبقي</TableHead>
                  <TableHead>نسبة الإنفاق</TableHead>
                  <TableHead>تاريخ البداية</TableHead>
                  <TableHead>تاريخ النهاية</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBudgets.map((budget) => {
                  const remaining = budget.amount - budget.spent;
                  const spentPercentage = (budget.spent / budget.amount) * 100;
                  
                  return (
                    <TableRow key={budget.id}>
                      <TableCell>{budget.category}</TableCell>
                      <TableCell>{formatCurrency(budget.amount)}</TableCell>
                      <TableCell>{formatCurrency(budget.spent)}</TableCell>
                      <TableCell className={remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(remaining)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className={`h-2.5 rounded-full ${
                                spentPercentage > 100 ? 'bg-red-600' :
                                spentPercentage > 80 ? 'bg-yellow-400' :
                                'bg-green-600'
                              }`}
                              style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {spentPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(budget.start_date)}</TableCell>
                      <TableCell>{formatDate(budget.end_date)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          budget.status === 'active' ? 'bg-green-100 text-green-800' :
                          budget.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {budget.status === 'active' ? 'نشط' :
                           budget.status === 'completed' ? 'مكتمل' : 'ملغي'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button className="text-blue-600 hover:text-blue-800">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDeleteBudget(budget.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
