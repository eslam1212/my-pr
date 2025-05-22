import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Truck, PackageCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const shippingSchema = z.object({
  name: z.string().min(3, 'اسم طريقة الشحن يجب أن يكون 3 أحرف على الأقل'),
  cost: z.number().min(0, 'تكلفة الشحن يجب أن تكون أكبر من أو تساوي صفر'),
  delivery_time: z.string().min(3, 'وقت التوصيل يجب أن يكون 3 أحرف على الأقل'),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

interface ShippingMethod extends ShippingFormData {
  id: number;
  created_at: string;
  updated_at: string;
}

interface Shipment {
  id: number;
  order_id: string;
  method_id: number;
  status: 'processing' | 'in_transit' | 'delivered';
  tracking_number: string;
  created_at: string;
  updated_at: string;
  shipping_method?: ShippingMethod;
}

interface ShippingFormProps {
  onSubmit: (data: ShippingFormData) => void;
  onClose: () => void;
  initialData?: Partial<ShippingFormData> | null;
  isSubmitting: boolean;
}

const ShippingForm: React.FC<ShippingFormProps> = ({ onSubmit, onClose, initialData, isSubmitting }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
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
        <label className="block text-sm font-medium text-gray-700 mb-1">اسم طريقة الشحن</label>
        <input
          {...register('name')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">تكلفة الشحن</label>
        <input
          {...register('cost', { valueAsNumber: true })}
          type="number"
          step="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.cost && <p className="mt-1 text-sm text-red-600">{errors.cost.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">وقت التوصيل</label>
        <input
          {...register('delivery_time')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.delivery_time && <p className="mt-1 text-sm text-red-600">{errors.delivery_time.message}</p>}
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

export function ShippingManager() {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchShippingMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('shipping_methods')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setShippingMethods(data || []);
    } catch (error) {
      console.error('Error fetching shipping methods:', error);
      toast.error('حدث خطأ أثناء تحميل طرق الشحن');
    }
  };

  const fetchShipments = async () => {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          shipping_method:shipping_methods(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setShipments(data || []);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      toast.error('حدث خطأ أثناء تحميل الشحنات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchShippingMethods(), fetchShipments()]);
  }, []);

  const handleAddMethod = async (data: ShippingFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('shipping_methods')
        .insert([data]);

      if (error) throw error;

      toast.success('تم إضافة طريقة الشحن بنجاح');
      setIsFormOpen(false);
      fetchShippingMethods();
    } catch (error) {
      console.error('Error adding shipping method:', error);
      toast.error('حدث خطأ أثناء إضافة طريقة الشحن');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMethod = async (data: ShippingFormData) => {
    if (!editingMethod) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('shipping_methods')
        .update(data)
        .eq('id', editingMethod.id);

      if (error) throw error;

      toast.success('تم تحديث طريقة الشحن بنجاح');
      setIsFormOpen(false);
      setEditingMethod(null);
      fetchShippingMethods();
    } catch (error) {
      console.error('Error updating shipping method:', error);
      toast.error('حدث خطأ أثناء تحديث طريقة الشحن');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMethod = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف طريقة الشحن هذه؟')) return;

    try {
      const { error } = await supabase
        .from('shipping_methods')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('تم حذف طريقة الشحن بنجاح');
      fetchShippingMethods();
    } catch (error) {
      console.error('Error deleting shipping method:', error);
      toast.error('حدث خطأ أثناء حذف طريقة الشحن');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            إدارة الشحن
          </h2>
          <p className="text-gray-500">
            إدارة طرق الشحن وتتبع الشحنات
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => {
              setEditingMethod(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة طريقة شحن
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">جاري تحميل البيانات...</p>
        </div>
      ) : (
        <>
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">طرق الشحن</h3>
            {shippingMethods.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Truck className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد طرق شحن</h3>
                <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة طريقة شحن جديدة.</p>
              </div>
            ) : (
              <div className="mt-6 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead>
                        <tr>
                          <th scope="col" className="py-3.5 pr-4 text-right text-sm font-semibold text-gray-900">
                            اسم الطريقة
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                            التكلفة
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                            وقت التوصيل
                          </th>
                          <th scope="col" className="relative py-3.5 pl-3">
                            <span className="sr-only">إجراءات</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {shippingMethods.map((method) => (
                          <tr key={method.id}>
                            <td className="whitespace-nowrap py-4 pr-4 text-sm">
                              <div className="flex items-center">
                                <div className="h-8 w-8 flex-shrink-0">
                                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Truck className="h-5 w-5 text-blue-600" />
                                  </div>
                                </div>
                                <div className="mr-4">
                                  <div className="font-medium text-gray-900">{method.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {method.cost} ريال
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {method.delivery_time}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 text-right text-sm font-medium">
                              <button
                                onClick={() => {
                                  setEditingMethod(method);
                                  setIsFormOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 ml-4"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteMethod(method.id)}
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
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">الشحنات الحالية</h3>
            {shipments.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <PackageCheck className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد شحنات</h3>
                <p className="mt-1 text-sm text-gray-500">لم يتم إنشاء أي شحنات بعد.</p>
              </div>
            ) : (
              <div className="mt-6 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead>
                        <tr>
                          <th scope="col" className="py-3.5 pr-4 text-right text-sm font-semibold text-gray-900">
                            رقم الطلب
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                            طريقة الشحن
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                            الحالة
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                            رقم التتبع
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {shipments.map((shipment) => (
                          <tr key={shipment.id}>
                            <td className="whitespace-nowrap py-4 pr-4 text-sm font-medium text-gray-900">
                              {shipment.order_id}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {shipment.shipping_method?.name}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                shipment.status === 'delivered'
                                  ? 'bg-green-100 text-green-800'
                                  : shipment.status === 'in_transit'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {shipment.status === 'delivered'
                                  ? 'تم التسليم'
                                  : shipment.status === 'in_transit'
                                  ? 'في الطريق'
                                  : 'قيد المعالجة'}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {shipment.tracking_number}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" dir="rtl">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mt-2 px-7 py-3">
                <div className="text-lg mb-4 font-medium text-gray-900">
                  {editingMethod ? 'تعديل طريقة الشحن' : 'إضافة طريقة شحن جديدة'}
                </div>
                <ShippingForm
                  onSubmit={editingMethod ? handleUpdateMethod : handleAddMethod}
                  onClose={() => {
                    setIsFormOpen(false);
                    setEditingMethod(null);
                  }}
                  initialData={editingMethod || null}
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
