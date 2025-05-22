import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const branchSchema = z.object({
  name: z.string().min(3, 'اسم الفرع يجب أن يكون 3 أحرف على الأقل'),
  address: z.string().min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل'),
  phone: z.string().optional().or(z.literal('')),
});

type BranchFormData = z.infer<typeof branchSchema>;

interface Branch extends BranchFormData {
  id: number;
  created_at: string;
  updated_at: string;
}

interface BranchFormProps {
  onSubmit: (data: BranchFormData) => void;
  onClose: () => void;
  initialData?: Partial<BranchFormData> | null;
  isSubmitting: boolean;
}

const BranchForm: React.FC<BranchFormProps> = ({ onSubmit, onClose, initialData, isSubmitting }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: initialData || {}
  });

  React.useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">اسم الفرع</label>
        <input
          {...register('name')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
        <input
          {...register('address')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">رقم التواصل</label>
        <input
          {...register('phone')}
          type="tel"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="flex justify-end space-x-2 space-x-reverse">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
        >
          {isSubmitting ? 'جاري الحفظ...' : initialData ? 'تحديث' : 'إضافة'}
        </button>
      </div>
    </form>
  );
};

export function BranchManager() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBranches = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBranches(data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('حدث خطأ أثناء تحميل الفروع');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleAddBranch = async (data: BranchFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('branches')
        .insert([data]);

      if (error) throw error;

      toast.success('تم إضافة الفرع بنجاح');
      setIsFormOpen(false);
      fetchBranches();
    } catch (error) {
      console.error('Error adding branch:', error);
      toast.error('حدث خطأ أثناء إضافة الفرع');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBranch = async (data: BranchFormData) => {
    if (!editingBranch) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('branches')
        .update(data)
        .eq('id', editingBranch.id);

      if (error) throw error;

      toast.success('تم تحديث الفرع بنجاح');
      setIsFormOpen(false);
      setEditingBranch(null);
      fetchBranches();
    } catch (error) {
      console.error('Error updating branch:', error);
      toast.error('حدث خطأ أثناء تحديث الفرع');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBranch = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفرع؟')) return;

    try {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('تم حذف الفرع بنجاح');
      fetchBranches();
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast.error('حدث خطأ أثناء حذف الفرع');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            إدارة الفروع
          </h2>
          <p className="text-gray-500">
            إدارة فروع الشركة وعناوينها
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => {
              setEditingBranch(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة فرع
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">جاري تحميل الفروع...</p>
        </div>
      ) : branches.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد فروع</h3>
          <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة فرع جديد.</p>
        </div>
      ) : (
        <div className="mt-6 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pr-4 text-right text-sm font-semibold text-gray-900">
                      اسم الفرع
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      العنوان
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      رقم التواصل
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3">
                      <span className="sr-only">إجراءات</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {branches.map((branch) => (
                    <tr key={branch.id}>
                      <td className="whitespace-nowrap py-4 pr-4 text-sm">
                        <div className="flex items-center">
                          <div className="h-8 w-8 flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="mr-4">
                            <div className="font-medium text-gray-900">{branch.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {branch.address}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {branch.phone || '-'}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditingBranch(branch);
                            setIsFormOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 ml-4"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBranch(branch.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" dir="rtl">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mt-2 px-7 py-3">
                <div className="text-lg mb-4 font-medium text-gray-900">
                  {editingBranch ? 'تعديل فرع' : 'إضافة فرع جديد'}
                </div>
                <BranchForm
                  onSubmit={editingBranch ? handleUpdateBranch : handleAddBranch}
                  onClose={() => {
                    setIsFormOpen(false);
                    setEditingBranch(null);
                  }}
                  initialData={editingBranch || null}
                  isSubmitting={isSubmitting}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
