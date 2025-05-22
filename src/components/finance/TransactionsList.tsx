import React from 'react';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const transactions = [
  {
    id: '1',
    title: 'فاتورة مبيعات #123',
    amount: 1500,
    type: 'income',
    date: '٢٠٢٤/٠٣/١٥'
  },
  {
    id: '2',
    title: 'مشتريات مخزون',
    amount: 800,
    type: 'expense',
    date: '٢٠٢٤/٠٣/١٤'
  }
];

export function TransactionsList() {
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">آخر المعاملات</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-full ${
                  transaction.type === 'income' 
                    ? 'bg-green-100' 
                    : 'bg-red-100'
                }`}>
                  {transaction.type === 'income' 
                    ? <ArrowUpRight className="h-4 w-4 text-green-600" />
                    : <ArrowDownLeft className="h-4 w-4 text-red-600" />
                  }
                </div>
                <div className="mr-3">
                  <p className="text-sm font-medium text-gray-900">
                    {transaction.title}
                  </p>
                  <p className="text-xs text-gray-500">{transaction.date}</p>
                </div>
              </div>
              <span className={`text-sm font-medium ${
                transaction.type === 'income' 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}
                {transaction.amount} ريال
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
