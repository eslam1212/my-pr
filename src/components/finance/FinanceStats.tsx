import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';

const stats = [
  {
    title: 'إجمالي الإيرادات',
    value: '١٢٥,٠٠٠ ريال',
    change: '+١٥٪',
    trend: 'up',
    icon: TrendingUp,
    color: 'green'
  },
  {
    title: 'إجمالي المصروفات',
    value: '٤٥,٠٠٠ ريال',
    change: '+٥٪',
    trend: 'up',
    icon: TrendingDown,
    color: 'red'
  },
  {
    title: 'صافي الربح',
    value: '٨٠,٠٠٠ ريال',
    change: '+٢٠٪',
    trend: 'up',
    icon: DollarSign,
    color: 'blue'
  },
  {
    title: 'الرصيد الحالي',
    value: '٢٠٠,٠٠٠ ريال',
    change: '+١٠٪',
    trend: 'up',
    icon: Wallet,
    color: 'indigo'
  }
];

export function FinanceStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div key={stat.title} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
              <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
            </div>
            <div className="mr-4 flex-1">
              <p className="text-sm text-gray-600">{stat.title}</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <span className={`mr-2 text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
