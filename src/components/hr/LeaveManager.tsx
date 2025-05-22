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

const leaveSchema = z.object({
  employee_id: z.string().min(1, 'اختر الموظف'),
  start_date: z.string().min(1, 'تاريخ البداية مطلوب'),
  end_date: z.string().min(1, 'تاريخ النهاية مطلوب'),
  type: z.enum(['annual', 'sick', 'unpaid', 'other'], {
    required_error: 'نوع الإجازة مطلوب',
  }),
  status: z.enum(['pending', 'approved', 'rejected'], {
    required_error: 'حالة الإجازة مطلوبة',
  }),
  reason: z.string().min(1, 'سبب الإجازة مطلوب'),
});

type Leave = z.infer<typeof leaveSchema>;

export function LeaveManager() {
  const [leaveRecords, setLeaveRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Leave>({
    resolver: zodResolver(leaveSchema),
  });

  useEffect(() => {
    fetchLeaves();
    fetchEmployees();
  }, []);

  async function fetchLeaves() {
    try {
      const { data, error } = await supabase
        .from('leaves')
        .select(`
          *,
          employees (
            name
          )
        `)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setLeaveRecords(data || []);
    } catch (error) {
      toast.error('حدث خطأ في جلب سجلات الإجازات');
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

  const onSubmit = async (data: Leave) => {
    try {
      const { error } = await supabase.from('leaves').insert([data]);
      if (error) throw error;
      
      toast.success('تم إضافة الإجازة بنجاح');
      setIsOpen(false);
      reset();
      fetchLeaves();
    } catch (error) {
      toast.error('حدث خطأ في إضافة الإجازة');
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'annual':
        return 'سنوية';
      case 'sick':
        return 'مرضية';
      case 'unpaid':
        return 'غير مدفوعة';
      case 'other':
        return 'أخرى';
      default:
        return type;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'قيد المراجعة';
      case 'approved':
        return 'مقبولة';
      case 'rejected':
        return 'مرفوضة';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'approved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  async function updateLeaveStatus(id: string, status: 'approved' | 'rejected') {
    try {
      const { error } = await supabase
        .from('leaves')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(`تم ${status === 'approved' ? 'قبول' : 'رفض'} الإجازة بنجاح`);
      fetchLeaves();
    } catch (error) {
      toast.error('حدث خطأ في تحديث حالة الإجازة');
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-gray-900">إدارة الإجازات</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>طلب إجازة جديدة</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]" dir="rtl">
            <DialogHeader>
              <DialogTitle>طلب إجازة جديدة</DialogTitle>
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
              <div>
                <Label htmlFor="type">نوع الإجازة</Label>
                <select
                  id="type"
                  className="w-full rounded-md border border-gray-300 p-2"
                  {...register('type')}
                >
                  <option value="">اختر النوع</option>
                  <option value="annual">سنوية</option>
                  <option value="sick">مرضية</option>
                  <option value="unpaid">غير مدفوعة</option>
                  <option value="other">أخرى</option>
                </select>
                {errors.type && (
                  <p className="text-red-500 text-sm">{errors.type.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="start_date">تاريخ البداية</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...register('start_date')}
                />
                {errors.start_date && (
                  <p className="text-red-500 text-sm">{errors.start_date.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="end_date">تاريخ النهاية</Label>
                <Input
                  id="end_date"
                  type="date"
                  {...register('end_date')}
                />
                {errors.end_date && (
                  <p className="text-red-500 text-sm">{errors.end_date.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="reason">سبب الإجازة</Label>
                <Input
                  id="reason"
                  {...register('reason')}
                />
                {errors.reason && (
                  <p className="text-red-500 text-sm">{errors.reason.message}</p>
                )}
              </div>
              <input
                type="hidden"
                value="pending"
                {...register('status')}
              />
              <Button type="submit" className="w-full">
                تقديم الطلب
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-4">جاري التحميل...</div>
      ) : leaveRecords.length === 0 ? (
        <p className="text-gray-500 text-center py-4">لا يوجد طلبات إجازات</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">الموظف</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">نوع الإجازة</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">تاريخ البداية</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">تاريخ النهاية</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">السبب</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">الحالة</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaveRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {record.employees?.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {getTypeText(record.type)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {format(new Date(record.start_date), 'dd/MM/yyyy', { locale: ar })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {format(new Date(record.end_date), 'dd/MM/yyyy', { locale: ar })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{record.reason}</td>
                  <td className={`px-4 py-3 text-sm ${getStatusColor(record.status)}`}>
                    {getStatusText(record.status)}
                  </td>
                  <td className="px-4 py-3 text-sm space-x-2">
                    {record.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => updateLeaveStatus(record.id, 'approved')}
                          className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-md text-xs"
                        >
                          قبول
                        </Button>
                        <Button
                          onClick={() => updateLeaveStatus(record.id, 'rejected')}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md text-xs"
                        >
                          رفض
                        </Button>
                      </>
                    )}
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
