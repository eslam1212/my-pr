import React from 'react';
import { Clock, ArrowUpRight, ArrowDownLeft, ChevronLeft } from 'lucide-react';

const activities = [
  {
    id: '1',
    type: 'sale',
    description: 'تمت إضافة فاتورة مبيعات جديدة #123',
    time: 'منذ 5 دقائق',
    amount: '1,200 ريال'
  },
  {
    id: '2',
    type: 'purchase',
    description: 'تم تسجيل عملية شراء جديدة للمخزون',
    time: 'منذ 10 دقائق',
    amount: '2,500 ريال'
  },
  {
    id: '3',
    type: 'customer',
    description: 'تم إضافة عميل جديد: شركة النور',
    time: 'منذ 20 دقيقة',
    amount: null
  }
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'sale':
      return <ArrowUpRight className="h-4 w-4" />;
    case 'purchase':
      return <ArrowDownLeft className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getActivityColors = (type: string) => {
  switch (type) {
    case 'sale':
      return 'bg-green-50 text-green-600';
    case 'purchase':
      return 'bg-red-50 text-red-600';
    default:
      return 'bg-indigo-50 text-indigo-600';
  }
};

export function RecentActivity() {
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">
          آخر الأنشطة
        </h2>
        <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
          عرض الكل
          <ChevronLeft className="h-4 w-4 mr-1" />
        </button>
      </div>

      {/* Activity List */}
      <ul className="space-y-3">
        {activities.map((activity) => (
          <li 
            key={activity.id} 
            className="bg-white rounded-lg p-3 hover:bg-gray-50 transition-colors duration-150 ease-in-out border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start min-w-0">
                <div className={`p-2 rounded-lg ${getActivityColors(activity.type)} flex-shrink-0 mt-1`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="mr-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.description}
                  </p>
                  <div className="flex items-center mt-1">
                    <p className="text-xs text-gray-500">
                      {activity.time}
                    </p>
                    {activity.amount && (
                      <>
                        <span className="mx-2 text-gray-300">•</span>
                        <p className="text-xs font-medium text-gray-700">
                          {activity.amount}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
