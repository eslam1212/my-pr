import React from 'react';
import { TrendingUp, DollarSign, Users, Package } from 'lucide-react';

const stats = [
  {
    title: 'إجمالي المبيعات',
    value: '١٢٥,٠٠٠ ريال',
    change: '+١٥٪',
    icon: DollarSign,
    color: 'blue',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600'
  },
  {
    title: 'عدد العملاء',
    value: '٤٥',
    change: '+٨٪',
    icon: Users,
    color: 'green',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600'
  },
  {
    title: 'المنتجات المتوفرة',
    value: '٣٢٠',
    change: '+١٢٪',
    icon: Package,
    color: 'purple',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600'
  },
  {
    title: 'صافي الربح',
    value: '٨٠,٠٠٠ ريال',
    change: '+٥٪',
    icon: TrendingUp,
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-600'
  }
];

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div 
          key={stat.title} 
          className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow duration-200 ease-in-out"
        >
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${stat.bgColor} flex-shrink-0`}>
              <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.textColor}`} />
            </div>
            <div className="mr-3 sm:mr-4 min-w-0">
              <p className="text-sm text-gray-600 truncate">{stat.title}</p>
              <div className="flex items-baseline flex-wrap">
                <p className="text-lg sm:text-2xl font-semibold text-gray-900 ml-1">{stat.value}</p>
                <span className={`text-sm font-medium ${stat.textColor}`}>
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
