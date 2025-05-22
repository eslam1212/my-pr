import React, { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '../../utils/format';
import { Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

type TaxTransaction = {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: 'sale' | 'income' | 'vat';
};

export function TaxReports() {
  const [transactions, setTransactions] = useState<TaxTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const fetchTransactions = async () => {
    try {
      let query = supabase
        .from('tax_transactions')
        .select('*')
        .order('date', { ascending: false });

      if (selectedType !== 'all') {
        query = query.eq('type', selectedType);
      }

      if (searchTerm) {
        query = query.ilike('description', `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching tax transactions:', error);
      toast.error('حدث خطأ أثناء تحميل المعاملات الضريبية');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [searchTerm, selectedType]);

  const totalAmount = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">تقارير الضرائب</h2>
      
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="بحث في المعاملات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="all">جميع الأنواع</option>
          <option value="sale">ضريبة المبيعات</option>
          <option value="income">ضريبة الدخل</option>
          <option value="vat">ضريبة القيمة المضافة</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري تحميل المعاملات...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">لا توجد معاملات ضريبية</p>
        </div>
      ) : (
        <>
          <div className="mt-4 -mx-4 sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th scope="col" className="sticky top-0 z-10 border-b border-gray-300 bg-white bg-opacity-75 py-3.5 pl-4 pr-3 text-right text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:pl-6 lg:pl-8">
                      التاريخ
                    </th>
                    <th scope="col" className="sticky top-0 z-10 border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-right text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">
                      الوصف
                    </th>
                    <th scope="col" className="sticky top-0 z-10 border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-right text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">
                      النوع
                    </th>
                    <th scope="col" className="sticky top-0 z-10 border-b border-gray-300 bg-white bg-opacity-75 py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:pr-6 lg:pr-8">
                      المبلغ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, idx) => (
                    <tr key={transaction.id}>
                      <td className={`whitespace-nowrap border-b border-gray-200 py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8 ${idx === 0 ? 'rounded-tl-lg rounded-tr-lg' : ''}`}>
                        {formatDate(transaction.date)}
                      </td>
                      <td className="whitespace-nowrap border-b border-gray-200 px-3 py-4 text-sm text-gray-500">
                        {transaction.description}
                      </td>
                      <td className="whitespace-nowrap border-b border-gray-200 px-3 py-4 text-sm text-gray-500">
                        {transaction.type === 'sale' && 'ضريبة المبيعات'}
                        {transaction.type === 'income' && 'ضريبة الدخل'}
                        {transaction.type === 'vat' && 'ضريبة القيمة المضافة'}
                      </td>
                      <td className="whitespace-nowrap border-b border-gray-200 py-4 pl-3 pr-4 text-sm text-gray-500 sm:pr-6 lg:pr-8">
                        {formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="border-t border-gray-200 px-4 py-4 text-sm font-medium text-gray-900 sm:px-6 lg:px-8">
                      الإجمالي
                    </td>
                    <td className="border-t border-gray-200 py-4 pl-3 pr-4 text-sm font-medium text-gray-900 sm:pr-6 lg:pr-8">
                      {formatCurrency(totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
