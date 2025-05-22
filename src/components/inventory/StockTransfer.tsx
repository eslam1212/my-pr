import React, { useState } from 'react';
import { formatCurrency, formatDate } from '../../utils/format';
import { ArrowRight, CheckCircle, X, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const transferSchema = z.object({
  product: z.string().min(1, 'المنتج مطلوب'),
  quantity: z.number().min(1, 'الكمية يجب أن تكون أكبر من صفر'),
  fromLocation: z.string().min(1, 'المستودع المصدر مطلوب'),
  toLocation: z.string().min(1, 'المستودع الوجهة مطلوب'),
});

type TransferFormData = z.infer<typeof transferSchema>;

const mockTransfers = [
  { id: 1, date: '2024-03-15', product: 'لابتوب HP', from: 'المستودع الرئيسي', to: 'المعرض', quantity: 2 },
  { id: 2, date: '2024-03-14', product: 'طابعة Canon', from: 'المستودع الرئيسي', to: 'المخزن', quantity: 1 },
  { id: 3, date: '2024-03-10', product: 'شاشة LG', from: 'المعرض', to: 'المستودع الرئيسي', quantity: 3 },
];

export function StockTransfer() {
  const [transfers, setTransfers] = useState(mockTransfers);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
  });

  const locations = ['المستودع الرئيسي', 'المعرض', 'المخزن'];
  const products = ['لابتوب HP', 'طابعة Canon', 'شاشة LG', 'لوحة مفاتيح', 'فأرة لاسلكية'];

  const onSubmit = async (data: TransferFormData) => {
    setTransfers([...transfers, { ...data, id: Date.now(), date: new Date().toISOString() }]);
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
    reset();
    setIsFormOpen(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        تحويل المخزون
      </h2>

      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 ml-2" />
          تحويل جديد
        </button>
      </div>

      {isSuccess && (
        <div className="bg-green-100 border border-green-200 rounded-md p-4 mb-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
          <p className="text-sm text-green-700">تم تحويل المخزون بنجاح</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                التاريخ
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                المنتج
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                من
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                إلى
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                الكمية
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transfers.map((transfer) => (
              <tr key={transfer.id}>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 sm:px-6">
                  {formatDate(new Date(transfer.date))}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                  {transfer.product}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                  {transfer.fromLocation}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                  {transfer.toLocation}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                  {transfer.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" dir="rtl">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">تحويل المخزون</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <TransferForm
              onSubmit={onSubmit}
              onClose={() => setIsFormOpen(false)}
              locations={locations}
              products={products}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface TransferFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
  locations: string[];
  products: string[];
}

const TransferForm: React.FC<TransferFormProps> = ({ onSubmit, onClose, locations, products }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<TransferFormData>({
    resolver: zodResolver(transferSchema),
  });

  const handleFormSubmit = (data: TransferFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">المنتج</label>
        <select
          {...register('product')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">اختر منتج</option>
          {products.map(product => (
            <option key={product} value={product}>{product}</option>
          ))}
        </select>
        {errors.product && <p className="mt-1 text-sm text-red-600">{errors.product.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
        <input
          {...register('quantity', { valueAsNumber: true })}
          type="number"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">من مستودع</label>
          <select
            {...register('fromLocation')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">اختر مستودع</option>
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
          {errors.fromLocation && <p className="mt-1 text-sm text-red-600">{errors.fromLocation.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">إلى مستودع</label>
          <select
            {...register('toLocation')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">اختر مستودع</option>
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
          {errors.toLocation && <p className="mt-1 text-sm text-red-600">{errors.toLocation.message}</p>}
        </div>
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
          تحويل
        </button>
      </div>
    </form>
  );
};
