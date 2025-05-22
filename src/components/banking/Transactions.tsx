import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '../../utils/format';
import { Search, ArrowUpRight, ArrowDownLeft, Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const transactionSchema = z.object({
  account_id: z.number().min(1, 'الحساب مطلوب'),
  type: z.enum(['deposit', 'withdrawal', 'transfer']),
  amount: z.number().min(0.01, 'المبلغ يجب أن يكون أكبر من صفر'),
  description: z.string().min(1, 'الوصف مطلوب'),
  date: z.string().min(1, 'التاريخ مطلوب'),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface Transaction extends TransactionFormData {
  id: number;
  created_at: string;
  account_name: string;
}

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
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
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل الحسابات');
    }
  }

  async function fetchTransactions() {
    try {
      let query = supabase
        .from('bank_transactions')
        .select(`
          *,
          bank_accounts (name)
        `)
        .order('date', { ascending: false });

      // Apply date filter
      const today = new Date();
      if (dateFilter === 'today') {
        query = query.eq('date', today.toISOString().split('T')[0]);
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today.setDate(today.getDate() - 7));
        query = query.gte('date', weekAgo.toISOString().split('T')[0]);
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today.setMonth(today.getMonth() - 1));
        query = query.gte('date', monthAgo.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedTransactions = data.map(t => ({
        ...t,
        account_name: t.bank_accounts.name
      }));

      setTransactions(formattedTransactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل المعاملات');
    } finally {
      setLoading(false);
    }
  }

  const handleAddTransaction = async (data: TransactionFormData) => {
    try {
      // First, get the current balance of the account
      const { data: account, error: accountError } = await supabase
        .from('bank_accounts')
        .select('current_balance')
        .eq('id', data.account_id)
        .single();

      if (accountError) throw accountError;

      // Calculate new balance
      const amount = data.type === 'deposit' ? data.amount : -data.amount;
      const newBalance = (account?.current_balance || 0) + amount;

      // Start a transaction to update both tables
      const { data: newTransaction, error: transactionError } = await supabase
        .from('bank_transactions')
        .insert([{
          ...data,
          amount: amount
        }])
        .select(`
          *,
          bank_accounts (name)
        `)
        .single();

      if (transactionError) throw transactionError;

      // Update account balance
      const { error: updateError } = await supabase
        .from('bank_accounts')
        .update({ current_balance: newBalance })
        .eq('id', data.account_id);

      if (updateError) throw updateError;

      setTransactions([{
        ...newTransaction,
        account_name: newTransaction.bank_accounts.name
      }, ...transactions]);
      setIsFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إضافة المعاملة');
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      transaction.description.toLowerCase().includes(searchLower) ||
      transaction.account_name.toLowerCase().includes(searchLower) ||
      formatCurrency(transaction.amount).includes(searchTerm)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 border-b border-red-100">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="بحث في المعاملات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          <div className="flex gap-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">كل المعاملات</option>
              <option value="today">اليوم</option>
              <option value="week">آخر أسبوع</option>
              <option value="month">آخر شهر</option>
            </select>

            <button
              onClick={() => setIsFormOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="inline-block w-4 h-4 ml-1" />
              معاملة جديدة
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحساب</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النوع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الوصف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.account_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.type === 'deposit'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type === 'deposit' ? (
                        <>
                          <ArrowDownLeft className="w-4 h-4 ml-1" />
                          إيداع
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-4 h-4 ml-1" />
                          سحب
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(Math.abs(transaction.amount))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <TransactionForm
          accounts={accounts}
          onSubmit={handleAddTransaction}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}

interface TransactionFormProps {
  accounts: { id: number; name: string }[];
  onSubmit: (data: TransactionFormData) => void;
  onClose: () => void;
}

function TransactionForm({ accounts, onSubmit, onClose }: TransactionFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      type: 'deposit'
    }
  });

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            إضافة معاملة جديدة
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">الحساب</label>
            <select
              {...register('account_id', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">اختر الحساب</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
            {errors.account_id && (
              <p className="mt-1 text-sm text-red-600">{errors.account_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">نوع المعاملة</label>
            <select
              {...register('type')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="deposit">إيداع</option>
              <option value="withdrawal">سحب</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">المبلغ</label>
            <input
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">الوصف</label>
            <input
              type="text"
              {...register('description')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">التاريخ</label>
            <input
              type="date"
              {...register('date')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              إضافة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
