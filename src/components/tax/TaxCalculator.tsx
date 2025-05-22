import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../utils/format';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const taxSchema = z.object({
  income: z.number().min(0, 'الدخل يجب أن يكون أكبر من أو يساوي صفر'),
  taxRate: z.number().min(0, 'معدل الضريبة يجب أن يكون أكبر من أو يساوي صفر'),
  taxCategory: z.enum(['standard', 'reduced', 'exempt'] as const),
});

type TaxFormData = z.infer<typeof taxSchema>;

export function TaxCalculator() {
  const [taxResult, setTaxResult] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<TaxFormData>({
    resolver: zodResolver(taxSchema),
    defaultValues: {
      taxCategory: 'standard',
      taxRate: 15
    }
  });

  const income = watch('income');
  const taxRate = watch('taxRate');
  const taxCategory = watch('taxCategory');

  const calculatedTax = useMemo(() => {
    if (!income || !taxRate) return 0;
    if (taxCategory === 'exempt') return 0;
    if (taxCategory === 'reduced') return (income * (taxRate / 2)) / 100;
    return (income * taxRate) / 100;
  }, [income, taxRate, taxCategory]);

  const onSubmit = async (data: TaxFormData) => {
    setIsLoading(true);
    try {
      const taxAmount = calculatedTax;
      
      const { error } = await supabase
        .from('tax_calculations')
        .insert({
          income: data.income,
          tax_rate: data.taxRate,
          tax_category: data.taxCategory,
          tax_amount: taxAmount,
        });

      if (error) throw error;

      setTaxResult(taxAmount);
      toast.success('تم حساب وحفظ الضريبة بنجاح');
    } catch (error) {
      console.error('Error saving tax calculation:', error);
      toast.error('حدث خطأ أثناء حفظ حساب الضريبة');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">حاسبة الضرائب</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            الدخل
          </label>
          <input
            type="number"
            step="0.01"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            {...register('income', { valueAsNumber: true })}
          />
          {errors.income && (
            <p className="mt-1 text-sm text-red-600">{errors.income.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            معدل الضريبة (%)
          </label>
          <input
            type="number"
            step="0.01"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            {...register('taxRate', { valueAsNumber: true })}
          />
          {errors.taxRate && (
            <p className="mt-1 text-sm text-red-600">{errors.taxRate.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            فئة الضريبة
          </label>
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            {...register('taxCategory')}
          >
            <option value="standard">قياسي</option>
            <option value="reduced">مخفض</option>
            <option value="exempt">معفى</option>
          </select>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'جاري الحساب...' : 'احسب الضريبة'}
          </button>
        </div>

        {taxResult !== null && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="text-lg font-medium text-gray-900">نتيجة الحساب:</h3>
            <p className="mt-2 text-2xl font-bold text-blue-600">
              {formatCurrency(taxResult)}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
