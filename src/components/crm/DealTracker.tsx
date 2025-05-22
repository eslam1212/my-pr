import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';

const dealSchema = z.object({
  title: z.string().min(2, 'عنوان الصفقة مطلوب'),
  value: z.number().min(0, 'قيمة الصفقة يجب أن تكون أكبر من أو تساوي صفر'),
  stage: z.enum(['جديدة', 'مفاوضات', 'عرض سعر', 'مغلقة مكسوبة', 'مغلقة خسارة']),
  contact_id: z.number().optional(),
  expected_close_date: z.string().min(1, 'تاريخ الإغلاق المتوقع مطلوب'),
  notes: z.string().optional(),
});

type DealFormData = z.infer<typeof dealSchema>;

export function DealTracker() {
  const [deals, setDeals] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
  });

  useEffect(() => {
    fetchDeals();
    fetchContacts();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deals')
        .select('*, contacts(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setContacts(data || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const onSubmit = async (data: DealFormData) => {
    try {
      if (editingDeal) {
        const { error } = await supabase
          .from('deals')
          .update(data)
          .eq('id', editingDeal.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('deals')
          .insert([data]);
        
        if (error) throw error;
      }
      
      fetchDeals();
      setShowForm(false);
      setEditingDeal(null);
      reset();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الصفقة؟')) {
      try {
        const { error } = await supabase
          .from('deals')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        fetchDeals();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleEdit = (deal: any) => {
    setEditingDeal(deal);
    setShowForm(true);
    reset({
      ...deal,
      contact_id: deal.contact_id || undefined,
      value: Number(deal.value),
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900">الصفقات</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingDeal(null);
            reset({});
          }}
          className="bg-blue-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm md:text-base"
        >
          <Plus size={20} />
          إضافة صفقة
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {editingDeal ? 'تعديل صفقة' : 'إضافة صفقة جديدة'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">عنوان الصفقة</label>
                <input
                  {...register('title')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">القيمة</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('value', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.value && (
                  <p className="mt-1 text-sm text-red-600">{errors.value.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">المرحلة</label>
                <select
                  {...register('stage')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="جديدة">جديدة</option>
                  <option value="مفاوضات">مفاوضات</option>
                  <option value="عرض سعر">عرض سعر</option>
                  <option value="مغلقة مكسوبة">مغلقة مكسوبة</option>
                  <option value="مغلقة خسارة">مغلقة خسارة</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">جهة الاتصال</label>
                <select
                  {...register('contact_id', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">اختر جهة اتصال</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">تاريخ الإغلاق المتوقع</label>
                <input
                  type="date"
                  {...register('expected_close_date')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.expected_close_date && (
                  <p className="mt-1 text-sm text-red-600">{errors.expected_close_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">ملاحظات</label>
                <textarea
                  {...register('notes')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {editingDeal ? 'تحديث' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">جاري التحميل...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  العنوان
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  القيمة
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المرحلة
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  جهة الاتصال
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ الإغلاق
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deals.map((deal) => (
                <tr key={deal.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {deal.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(deal.value)}
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      deal.stage === 'مغلقة مكسوبة' ? 'bg-green-100 text-green-800' :
                      deal.stage === 'مغلقة خسارة' ? 'bg-red-100 text-red-800' :
                      deal.stage === 'مفاوضات' ? 'bg-yellow-100 text-yellow-800' :
                      deal.stage === 'عرض سعر' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {deal.stage}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {deal.contacts?.name}
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(deal.expected_close_date).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(deal)}
                      className="text-indigo-600 hover:text-indigo-900 ml-4"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(deal.id)}
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
      )}
    </div>
  );
}
