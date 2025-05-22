import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../utils/format';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const depreciationSchema = z.object({
  asset: z.string().min(1, 'الأصل مطلوب'),
  method: z.enum(['straight-line', 'declining-balance'] as const),
  cost: z.number().min(0, 'تكلفة الأصل يجب أن تكون أكبر من صفر'),
  salvageValue: z.number().min(0, 'القيمة التخريدية يجب أن تكون أكبر من أو تساوي صفر'),
  usefulLife: z.number().min(1, 'العمر الإنتاجي يجب أن يكون أكبر من صفر'),
  depreciationRate: z.number().optional(),
});

type DepreciationFormData = z.infer<typeof depreciationSchema>;

const mockAssets = [
  { id: 1, name: 'لابتوب HP' },
  { id: 2, name: 'طابعة Canon' },
  { id: 3, name: 'سيارة نقل' },
  { id: 4, name: 'أثاث مكتبي' },
  { id: 5, name: 'مكيف مركزي' },
];

export function DepreciationCalculator() {
  const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm<DepreciationFormData>({
    resolver: zodResolver(depreciationSchema),
    defaultValues: {
      method: 'straight-line',
    }
  });
  const [results, setResults] = useState<any[]>([]);
  const method = watch('method');
  const usefulLife = watch('usefulLife') || 0;
  const cost = watch('cost') || 0;
  const salvageValue = watch('salvageValue') || 0;
  const depreciationRate = watch('depreciationRate') || 0;

  const calculateDepreciation = (data: DepreciationFormData) => {
    const { cost, salvageValue, usefulLife, method, depreciationRate } = data;
    const annualDepreciation = (cost - salvageValue) / usefulLife;
    let currentBookValue = cost;
    const depreciationResults = [];

    for (let year = 1; year <= usefulLife; year++) {
      let depreciation = 0;
      if (method === 'straight-line') {
        depreciation = annualDepreciation;
      } else if (method === 'declining-balance') {
        depreciation = currentBookValue * (depreciationRate / 100);
        if (currentBookValue - depreciation < salvageValue) {
          depreciation = currentBookValue - salvageValue;
        }
      }
      currentBookValue -= depreciation;
      depreciationResults.push({
        year,
        depreciation,
        accumulatedDepreciation: cost - currentBookValue,
        bookValue: currentBookValue
      });
    }
    setResults(depreciationResults);
  };

  const chartData = useMemo(() => {
    return results.map(result => ({
      year: result.year,
      bookValue: result.bookValue,
      accumulatedDepreciation: result.accumulatedDepreciation
    }));
  }, [results]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        حساب الإهلاك
      </h2>

      <form onSubmit={handleSubmit(calculateDepreciation)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الأصل</label>
          <select
            {...register('asset')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">اختر الأصل</option>
            {mockAssets.map(asset => (
              <option key={asset.id} value={asset.name}>{asset.name}</option>
            ))}
          </select>
          {errors.asset && <p className="mt-1 text-sm text-red-600">{errors.asset.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الإهلاك</label>
          <select
            {...register('method')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="straight-line">القسط الثابت</option>
            <option value="declining-balance">الرصيد المتناقص</option>
          </select>
          {errors.method && <p className="mt-1 text-sm text-red-600">{errors.method.message}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تكلفة الأصل</label>
            <input
              {...register('cost', { valueAsNumber: true })}
              type="number"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.cost && <p className="mt-1 text-sm text-red-600">{errors.cost.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">القيمة التخريدية</label>
            <input
              {...register('salvageValue', { valueAsNumber: true })}
              type="number"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.salvageValue && <p className="mt-1 text-sm text-red-600">{errors.salvageValue.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">العمر الإنتاجي (سنوات)</label>
            <input
              {...register('usefulLife', { valueAsNumber: true })}
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.usefulLife && <p className="mt-1 text-sm text-red-600">{errors.usefulLife.message}</p>}
          </div>
          {method === 'declining-balance' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">معدل الإهلاك (%)</label>
              <input
                {...register('depreciationRate', { valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {errors.depreciationRate && <p className="mt-1 text-sm text-red-600">{errors.depreciationRate.message}</p>}
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
          >
            حساب الإهلاك
          </button>
        </div>
      </form>

      {results.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            نتائج الإهلاك
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                    السنة
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                    الإهلاك السنوي
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                    الإهلاك المتراكم
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                    القيمة الدفترية
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result) => (
                  <tr key={result.year}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 sm:px-6">
                      {result.year}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                      {formatCurrency(result.depreciation)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                      {formatCurrency(result.accumulatedDepreciation)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                      {formatCurrency(result.bookValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            الإهلاك بمرور الوقت
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="bookValue" stroke="#8884d8" name="القيمة الدفترية" />
              <Line type="monotone" dataKey="accumulatedDepreciation" stroke="#82ca9d" name="الإهلاك المتراكم" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
