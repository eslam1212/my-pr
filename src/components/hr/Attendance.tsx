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

const attendanceSchema = z.object({
  employee_id: z.string().min(1, 'اختر الموظف'),
  date: z.string().min(1, 'التاريخ مطلوب'),
  check_in: z.string().min(1, 'وقت الحضور مطلوب'),
  check_out: z.string().optional(),
  status: z.enum(['present', 'absent', 'late'], {
    required_error: 'اختر الحالة',
  }),
  notes: z.string().optional(),
});

type Attendance = z.infer<typeof attendanceSchema>;

export function Attendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Attendance>({
    resolver: zodResolver(attendanceSchema),
  });

  useEffect(() => {
    fetchAttendance();
    fetchEmployees();
  }, []);

  async function fetchAttendance() {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          employees (
            name
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      setAttendanceRecords(data || []);
    } catch (error) {
      toast.error('حدث خطأ في جلب سجلات الحضور');
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

  const onSubmit = async (data: Attendance) => {
    try {
      const { error } = await supabase.from('attendance').insert([data]);
      if (error) throw error;
      
      toast.success('تم تسجيل الحضور بنجاح');
      setIsOpen(false);
      reset();
      fetchAttendance();
    } catch (error) {
      toast.error('حدث خطأ في تسجيل الحضور');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'text-green-600';
      case 'absent':
        return 'text-red-600';
      case 'late':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return 'حاضر';
      case 'absent':
        return 'غائب';
      case 'late':
        return 'متأخر';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-gray-900">سجل الحضور والانصراف</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>تسجيل حضور جديد</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]" dir="rtl">
            <DialogHeader>
              <DialogTitle>تسجيل حضور جديد</DialogTitle>
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
                <Label htmlFor="date">التاريخ</Label>
                <Input
                  id="date"
                  type="date"
                  {...register('date')}
                />
                {errors.date && (
                  <p className="text-red-500 text-sm">{errors.date.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="check_in">وقت الحضور</Label>
                <Input
                  id="check_in"
                  type="time"
                  {...register('check_in')}
                />
                {errors.check_in && (
                  <p className="text-red-500 text-sm">{errors.check_in.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="check_out">وقت الانصراف</Label>
                <Input
                  id="check_out"
                  type="time"
                  {...register('check_out')}
                />
              </div>
              <div>
                <Label htmlFor="status">الحالة</Label>
                <select
                  id="status"
                  className="w-full rounded-md border border-gray-300 p-2"
                  {...register('status')}
                >
                  <option value="">اختر الحالة</option>
                  <option value="present">حاضر</option>
                  <option value="absent">غائب</option>
                  <option value="late">متأخر</option>
                </select>
                {errors.status && (
                  <p className="text-red-500 text-sm">{errors.status.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="notes">ملاحظات</Label>
                <Input
                  id="notes"
                  {...register('notes')}
                />
              </div>
              <Button type="submit" className="w-full">
                تسجيل
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-4">جاري التحميل...</div>
      ) : attendanceRecords.length === 0 ? (
        <p className="text-gray-500 text-center py-4">لا يوجد سجلات حضور</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">الموظف</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">التاريخ</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">وقت الحضور</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">وقت الانصراف</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">الحالة</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attendanceRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {record.employees?.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {format(new Date(record.date), 'dd/MM/yyyy', { locale: ar })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{record.check_in}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{record.check_out || '-'}</td>
                  <td className={`px-4 py-3 text-sm ${getStatusColor(record.status)}`}>
                    {getStatusText(record.status)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{record.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
