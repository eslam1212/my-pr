import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../../lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'react-toastify';

const employeeSchema = z.object({
  name: z.string().min(2, 'الاسم مطلوب'),
  position: z.string().min(2, 'المنصب مطلوب'),
  department: z.string().min(2, 'القسم مطلوب'),
  salary: z.string().transform(Number),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  phone: z.string().min(10, 'رقم الهاتف غير صالح'),
});

type Employee = z.infer<typeof employeeSchema>;

export function EmployeeList() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Employee>({
    resolver: zodResolver(employeeSchema),
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      toast.error('حدث خطأ في جلب بيانات الموظفين');
    } finally {
      setIsLoading(false);
    }
  }

  const onSubmit = async (data: Employee) => {
    try {
      const { error } = await supabase.from('employees').insert([data]);
      if (error) throw error;
      
      toast.success('تم إضافة الموظف بنجاح');
      setIsOpen(false);
      reset();
      fetchEmployees();
    } catch (error) {
      toast.error('حدث خطأ في إضافة الموظف');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-gray-900">قائمة الموظفين</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>إضافة موظف جديد</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة موظف جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">الاسم</Label>
                <Input id="name" {...register('name')} />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="position">المنصب</Label>
                <Input id="position" {...register('position')} />
                {errors.position && (
                  <p className="text-red-500 text-sm">{errors.position.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="department">القسم</Label>
                <Input id="department" {...register('department')} />
                {errors.department && (
                  <p className="text-red-500 text-sm">{errors.department.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="salary">الراتب</Label>
                <Input
                  id="salary"
                  type="number"
                  {...register('salary')}
                />
                {errors.salary && (
                  <p className="text-red-500 text-sm">{errors.salary.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm">{errors.phone.message}</p>
                )}
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
      ) : employees.length === 0 ? (
        <p className="text-gray-500 text-center py-4">لا يوجد موظفين حالياً</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">الاسم</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">المنصب</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">القسم</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">الراتب</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">البريد الإلكتروني</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">رقم الهاتف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{employee.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{employee.position}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{employee.department}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{employee.salary}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{employee.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{employee.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
