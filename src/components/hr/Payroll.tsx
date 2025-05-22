import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'react-toastify';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

const payrollSchema = z.object({
  employee_id: z.string().min(1, 'اختر الموظف'),
  month: z.string().min(1, 'الشهر مطلوب'),
  year: z.string().min(1, 'السنة مطلوبة'),
  basic_salary: z.string().transform(Number),
  allowances: z.string().transform(Number),
  deductions: z.string().transform(Number),
  overtime: z.string().transform(Number),
  bonus: z.string().transform(Number),
  notes: z.string().optional(),
});

type Payroll = z.infer<typeof payrollSchema>;

export function Payroll() {
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<Payroll>({
    resolver: zodResolver(payrollSchema),
  });

  const basicSalary = watch('basic_salary', '0');
  const allowances = watch('allowances', '0');
  const deductions = watch('deductions', '0');
  const overtime = watch('overtime', '0');
  const bonus = watch('bonus', '0');

  const totalSalary = 
    Number(basicSalary || 0) + 
    Number(allowances || 0) - 
    Number(deductions || 0) + 
    Number(overtime || 0) + 
    Number(bonus || 0);

  useEffect(() => {
    fetchPayroll();
    fetchEmployees();
  }, []);

  async function fetchPayroll() {
    try {
      const { data, error } = await supabase
        .from('payroll')
        .select(`
          *,
          employees (
            name
          )
        `)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      setPayrollRecords(data || []);
    } catch (error) {
      toast.error('حدث خطأ في جلب سجلات الرواتب');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchEmployees() {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      toast.error('حدث خطأ في جلب بيانات الموظفين');
    }
  }

  const onSubmit = async (data: Payroll) => {
    try {
      const { error } = await supabase.from('payroll').insert([{
        ...data,
        total_salary: totalSalary
      }]);
      if (error) throw error;
      
      toast.success('تم إضافة الراتب بنجاح');
      setIsOpen(false);
      reset();
      fetchPayroll();
    } catch (error) {
      toast.error('حدث خطأ في إضافة الراتب');
    }
  };

  const getMonthName = (month: string) => {
    const date = new Date(2024, parseInt(month) - 1, 1);
    return format(date, 'MMMM', { locale: ar });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-gray-900">الرواتب</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>إضافة راتب جديد</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة راتب جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="employee_id">الموظف</Label>
                <select
                  id="employee_id"
                  className="w-full rounded-md border border-gray-300 p-2"
                  {...register('employee_id')}
                >
                  <option value="">اختر الموظف</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
                {errors.employee_id && (
                  <p className="text-red-500 text-sm">{errors.employee_id.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="month">الشهر</Label>
                  <select
                    id="month"
                    className="w-full rounded-md border border-gray-300 p-2"
                    {...register('month')}
                  >
                    <option value="">اختر الشهر</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        {getMonthName(month.toString())}
                      </option>
                    ))}
                  </select>
                  {errors.month && (
                    <p className="text-red-500 text-sm">{errors.month.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="year">السنة</Label>
                  <Input
                    id="year"
                    type="number"
                    min="2024"
                    max="2030"
                    {...register('year')}
                  />
                  {errors.year && (
                    <p className="text-red-500 text-sm">{errors.year.message}</p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="basic_salary">الراتب الأساسي</Label>
                <Input
                  id="basic_salary"
                  type="number"
                  {...register('basic_salary')}
                />
                {errors.basic_salary && (
                  <p className="text-red-500 text-sm">{errors.basic_salary.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="allowances">البدلات</Label>
                <Input
                  id="allowances"
                  type="number"
                  {...register('allowances')}
                />
              </div>
              <div>
                <Label htmlFor="deductions">الخصومات</Label>
                <Input
                  id="deductions"
                  type="number"
                  {...register('deductions')}
                />
              </div>
              <div>
                <Label htmlFor="overtime">العمل الإضافي</Label>
                <Input
                  id="overtime"
                  type="number"
                  {...register('overtime')}
                />
              </div>
              <div>
                <Label htmlFor="bonus">المكافآت</Label>
                <Input
                  id="bonus"
                  type="number"
                  {...register('bonus')}
                />
              </div>
              <div>
                <Label htmlFor="notes">ملاحظات</Label>
                <Input
                  id="notes"
                  {...register('notes')}
                />
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-lg font-medium text-gray-900">
                  إجمالي الراتب: {totalSalary.toLocaleString('ar-SA')} ريال
                </div>
              </div>
              <Button type="submit" className="w-full">
                إضافة
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-4">جاري التحميل...</div>
      ) : payrollRecords.length === 0 ? (
        <p className="text-gray-500 text-center py-4">لا يوجد سجلات رواتب</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">الموظف</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">الشهر</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">السنة</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">الراتب الأساسي</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">البدلات</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">الخصومات</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">العمل الإضافي</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">المكافآت</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payrollRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {record.employees?.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {getMonthName(record.month)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{record.year}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {record.basic_salary.toLocaleString('ar-SA')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {record.allowances.toLocaleString('ar-SA')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {record.deductions.toLocaleString('ar-SA')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {record.overtime.toLocaleString('ar-SA')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {record.bonus.toLocaleString('ar-SA')}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {record.total_salary.toLocaleString('ar-SA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
