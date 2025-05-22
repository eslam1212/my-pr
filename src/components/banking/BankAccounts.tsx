import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/format';
import { toast } from 'react-hot-toast';

// Define the schema for bank accounts
const accountSchema = z.object({
  name: z.string().min(1, 'اسم الحساب مطلوب'),
  bank: z.string().min(1, 'اسم البنك مطلوب'),
  account_number: z.string().min(1, 'رقم الحساب مطلوب'),
  iban: z.string().min(1, 'رقم الآيبان مطلوب'),
  initial_balance: z.number().min(0, 'الرصيد الافتتاحي يجب أن يكون رقماً موجباً'),
  status: z.enum(['active', 'inactive']).default('active'),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface Account extends AccountFormData {
  id: number;
  created_at: string;
  current_balance: number;
}

interface AccountFormProps {
  onSubmit: (data: AccountFormData) => Promise<void>;
  onClose: () => void;
  initialData?: Account | null;
  isSubmitting: boolean;
}

const AccountForm: React.FC<AccountFormProps> = ({ onSubmit, onClose, initialData, isSubmitting }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: initialData || {
      status: 'active',
      initial_balance: 0
    }
  });

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">اسم الحساب</label>
        <input
          {...register('name')}
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">البنك</label>
        <input
          {...register('bank')}
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.bank && <p className="mt-1 text-sm text-red-600">{errors.bank.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">رقم الحساب</label>
        <input
          {...register('account_number')}
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.account_number && <p className="mt-1 text-sm text-red-600">{errors.account_number.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">رقم الآيبان</label>
        <input
          {...register('iban')}
          type="text"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.iban && <p className="mt-1 text-sm text-red-600">{errors.iban.message}</p>}
      </div>

      {!initialData && (
        <div>
          <label className="block text-sm font-medium text-gray-700">الرصيد الافتتاحي</label>
          <input
            {...register('initial_balance', { valueAsNumber: true })}
            type="number"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.initial_balance && <p className="mt-1 text-sm text-red-600">{errors.initial_balance.message}</p>}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">الحالة</label>
        <select
          {...register('status')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
        </select>
        {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
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

export function BankAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      toast.error('حدث خطأ أثناء تحميل الحسابات');
    } finally {
      setLoading(false);
    }
  }

  const handleAddAccount = async (data: AccountFormData) => {
    setIsSubmitting(true);
    try {
      const { data: newAccount, error } = await supabase
        .from('bank_accounts')
        .insert([{
          ...data,
          current_balance: data.initial_balance
        }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success('تم إضافة الحساب بنجاح');
      setAccounts([newAccount, ...accounts]);
      setIsFormOpen(false);
    } catch (err) {
      console.error('Error adding account:', err);
      toast.error('حدث خطأ أثناء إضافة الحساب');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAccount = async (data: AccountFormData) => {
    if (!editingAccount) return;
    setIsSubmitting(true);

    try {
      const { data: updatedAccount, error } = await supabase
        .from('bank_accounts')
        .update({
          name: data.name,
          bank: data.bank,
          account_number: data.account_number,
          iban: data.iban,
          status: data.status
        })
        .eq('id', editingAccount.id)
        .select()
        .single();

      if (error) throw error;

      toast.success('تم تحديث الحساب بنجاح');
      setAccounts(accounts.map(account => 
        account.id === editingAccount.id ? updatedAccount : account
      ));
      setIsFormOpen(false);
      setEditingAccount(null);
    } catch (err) {
      console.error('Error updating account:', err);
      toast.error('حدث خطأ أثناء تحديث الحساب');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحساب؟')) return;

    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('تم حذف الحساب بنجاح');
      setAccounts(accounts.filter(account => account.id !== id));
    } catch (err) {
      console.error('Error deleting account:', err);
      toast.error('حدث خطأ أثناء حذف الحساب');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-2">جاري تحميل الحسابات...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">الحسابات البنكية</h2>
          <p className="mt-1 text-sm text-gray-500">إدارة الحسابات البنكية والأرصدة</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => {
              setEditingAccount(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة حساب
          </button>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد حسابات</h3>
          <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة حساب بنكي جديد.</p>
        </div>
      ) : (
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pr-4 text-right text-sm font-semibold text-gray-900">
                      اسم الحساب
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      البنك
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      رقم الحساب
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      الرصيد الحالي
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      الحالة
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3">
                      <span className="sr-only">إجراءات</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {accounts.map((account) => (
                    <tr key={account.id}>
                      <td className="whitespace-nowrap py-4 pr-4 text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className="h-8 w-8 flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Building className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="mr-4">
                            <div className="font-medium">{account.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {account.bank}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {account.account_number}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium">
                        {formatCurrency(account.current_balance)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          account.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {account.status === 'active' ? 'نشط' : 'غير نشط'}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditingAccount(account);
                            setIsFormOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 ml-4"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(account.id)}
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" dir="rtl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingAccount ? 'تعديل الحساب' : 'إضافة حساب جديد'}
              </h3>
              <button
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingAccount(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <AccountForm
              onSubmit={editingAccount ? handleUpdateAccount : handleAddAccount}
              onClose={() => {
                setIsFormOpen(false);
                setEditingAccount(null);
              }}
              initialData={editingAccount}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
}
