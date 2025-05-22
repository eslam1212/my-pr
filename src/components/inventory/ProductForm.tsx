import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';

// تعريف schema باستخدام Zod
const productSchema = z.object({
  name: z.string().min(3, 'اسم المنتج يجب أن يكون 3 أحرف على الأقل'),
  sku: z.string().min(3, 'رمز المنتج يجب أن يكون 3 أحرف على الأقل'),
  price: z.number().min(0, 'السعر يجب أن يكون أكبر من صفر'),
  cost: z.number().min(0, 'التكلفة يجب أن تكون أكبر من صفر'),
  quantity: z.number().min(0, 'الكمية يجب أن تكون أكبر من صفر'),
  minQuantity: z.number().min(0, 'الحد الأدنى للكمية يجب أن يكون أكبر من صفر'),
  unit: z.enum(['piece', 'kilogram', 'box', 'ton', 'sack'] as const),
  description: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const unitLabels = {
  piece: 'قطعة',
  kilogram: 'كيلوجرام',
  box: 'كرتونة',
  ton: 'طن',
  sack: 'شوال',
};

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => void;
  onClose: () => void;
  initialData?: ProductFormData; // بيانات المنتج المحدد (للتعديل)
}

export function ProductForm({ onSubmit, onClose, initialData }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      unit: 'piece',
    },
  });

  // تعيين القيم الأولية إذا كان هناك بيانات أولية (للتعديل)
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: ProductFormData) => {
    console.log('Form data being submitted:', data); // تحقق من البيانات المرسلة
    
    // Convert camelCase to snake_case for database compatibility
    const formattedData = {
      ...data,
      min_quantity: data.minQuantity,
    };
    
    // Remove the camelCase property
    delete (formattedData as any).minQuantity;
    
    onSubmit(formattedData as any);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" dir="rtl">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{initialData ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج</label>
            <input
              {...register('name')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رمز المنتج</label>
            <input
              {...register('sku')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">سعر البيع</label>
              <input
                {...register('price', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">سعر التكلفة</label>
              <input
                {...register('cost', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {errors.cost && <p className="mt-1 text-sm text-red-600">{errors.cost.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
              <input
                {...register('quantity', { valueAsNumber: true })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأدنى</label>
              <input
                {...register('minQuantity', { valueAsNumber: true })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {errors.minQuantity && <p className="mt-1 text-sm text-red-600">{errors.minQuantity.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">وحدة القياس</label>
            <select
              {...register('unit')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {Object.entries(unitLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
            >
              {initialData ? 'تحديث' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
