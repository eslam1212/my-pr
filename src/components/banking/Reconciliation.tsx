import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '../../utils/format';
import { Upload, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';

const reconciliationSchema = z.object({
  account_id: z.number().min(1, 'الحساب مطلوب'),
  statement_date: z.string().min(1, 'تاريخ كشف الحساب مطلوب'),
  statement_balance: z.number().min(0, 'الرصيد يجب أن يكون رقماً موجباً'),
  notes: z.string().optional(),
});

type ReconciliationFormData = z.infer<typeof reconciliationSchema>;

interface ReconciliationRecord {
  id: number;
  account_id: number;
  account_name: string;
  statement_date: string;
  statement_balance: number;
  system_balance: number;
  difference: number;
  status: 'pending' | 'matched' | 'unmatched';
  notes?: string;
  created_at: string;
}

interface ReconciliationFormProps {
  accounts: { id: number; name: string }[];
  onSubmit: (data: ReconciliationFormData) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}

const ReconciliationForm: React.FC<ReconciliationFormProps> = ({ accounts, onSubmit, onClose, isSubmitting }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<ReconciliationFormData>({
    resolver: zodResolver(reconciliationSchema),
    defaultValues: {
      statement_date: new Date().toISOString().split('T')[0],
    }
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">الحساب</label>
        <select
          {...register('account_id', { valueAsNumber: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">اختر الحساب</option>
          {accounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        {errors.account_id && <p className="mt-1 text-sm text-red-600">{errors.account_id.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">تاريخ كشف الحساب</label>
        <input
          type="date"
          {...register('statement_date')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.statement_date && <p className="mt-1 text-sm text-red-600">{errors.statement_date.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">رصيد كشف الحساب</label>
        <input
          type="number"
          step="0.01"
          {...register('statement_balance', { valueAsNumber: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.statement_balance && <p className="mt-1 text-sm text-red-600">{errors.statement_balance.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">ملاحظات</label>
        <textarea
          {...register('notes')}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
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
          {isSubmitting ? 'جاري الحفظ...' : 'إضافة تسوية'}
        </button>
      </div>
    </form>
  );
};

export function Reconciliation() {
  const [reconciliations, setReconciliations] = useState<ReconciliationRecord[]>([]);
  const [accounts, setAccounts] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([fetchReconciliations(), fetchAccounts()]);
  }, []);

  async function fetchAccounts() {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('id, name')
        .eq('status', 'active');

      if (error) throw error;
      setAccounts(data || []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      toast.error('حدث خطأ أثناء تحميل الحسابات');
    }
  }

  async function fetchReconciliations() {
    try {
      const { data, error } = await supabase
        .from('bank_reconciliations')
        .select(`
          *,
          bank_accounts (name)
        `)
        .order('statement_date', { ascending: false });

      if (error) throw error;

      const formattedReconciliations = data.map(r => ({
        ...r,
        account_name: r.bank_accounts.name
      }));

      setReconciliations(formattedReconciliations);
    } catch (err) {
      console.error('Error fetching reconciliations:', err);
      toast.error('حدث خطأ أثناء تحميل التسويات');
    } finally {
      setLoading(false);
    }
  }

  const handleAddReconciliation = async (data: ReconciliationFormData) => {
    setIsSubmitting(true);
    try {
      // Get the current balance from the system
      const { data: account, error: accountError } = await supabase
        .from('bank_accounts')
        .select('current_balance')
        .eq('id', data.account_id)
        .single();

      if (accountError) throw accountError;

      const systemBalance = account?.current_balance || 0;
      const difference = data.statement_balance - systemBalance;
      const status = Math.abs(difference) < 0.01 ? 'matched' : 'unmatched';

      const { data: newReconciliation, error } = await supabase
        .from('bank_reconciliations')
        .insert([{
          ...data,
          system_balance: systemBalance,
          difference: difference,
          status: status
        }])
        .select(`
          *,
          bank_accounts (name)
        `)
        .single();

      if (error) throw error;

      toast.success('تم إضافة التسوية بنجاح');
      setReconciliations([{
        ...newReconciliation,
        account_name: newReconciliation.bank_accounts.name
      }, ...reconciliations]);
      setIsFormOpen(false);
    } catch (err) {
      console.error('Error adding reconciliation:', err);
      toast.error('حدث خطأ أثناء إضافة التسوية');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-2">جاري تحميل التسويات...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">تسوية الحسابات البنكية</h2>
          <p className="mt-1 text-sm text-gray-500">مطابقة أرصدة الحسابات مع كشوف البنك</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Upload className="h-4 w-4 ml-2" />
            تسوية جديدة
          </button>
        </div>
      </div>

      <div className="mt-4">
        <select
          value={selectedAccountId || ''}
          onChange={(e) => setSelectedAccountId(e.target.value ? Number(e.target.value) : null)}
          className="block w-full sm:w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">كل الحسابات</option>
          {accounts.map(account => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </div>

      {reconciliations.length === 0 ? (
        <div className="text-center py-12">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد تسويات</h3>
          <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة تسوية جديدة.</p>
        </div>
      ) : (
        <div className="mt-6 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pr-4 text-right text-sm font-semibold text-gray-900">التاريخ</th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">الحساب</th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">رصيد الكشف</th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">رصيد النظام</th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">الفرق</th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">الحالة</th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reconciliations
                    .filter(r => !selectedAccountId || r.account_id === selectedAccountId)
                    .map((reconciliation) => (
                      <tr key={reconciliation.id}>
                        <td className="whitespace-nowrap py-4 pr-4 text-sm text-gray-900">
                          {formatDate(reconciliation.statement_date)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {reconciliation.account_name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {formatCurrency(reconciliation.statement_balance)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                          {formatCurrency(reconciliation.system_balance)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium">
                          <span className={reconciliation.difference === 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(Math.abs(reconciliation.difference))}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            reconciliation.status === 'matched'
                              ? 'bg-green-100 text-green-800'
                              : reconciliation.status === 'unmatched'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {reconciliation.status === 'matched' ? (
                              <CheckCircle className="h-4 w-4 text-green-500 ml-1" />
                            ) : reconciliation.status === 'unmatched' ? (
                              <AlertTriangle className="h-4 w-4 text-red-500 ml-1" />
                            ) : null}
                            {reconciliation.status === 'matched'
                              ? 'مطابق'
                              : reconciliation.status === 'unmatched'
                              ? 'غير مطابق'
                              : 'قيد المراجعة'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {reconciliation.notes || '-'}
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" dir="rtl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                إضافة تسوية جديدة
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ReconciliationForm
              accounts={accounts}
              onSubmit={handleAddReconciliation}
              onClose={() => setIsFormOpen(false)}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
}
