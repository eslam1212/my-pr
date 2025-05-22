import React from 'react';
import { Plus, User, Package, FileText } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const actions = [
  {
    title: 'إضافة عميل جديد',
    description: 'إضافة عميل جديد إلى النظام',
    icon: User,
    path: '/contacts',
    color: 'indigo'
  },
  {
    title: 'إضافة منتج جديد',
    description: 'إضافة منتج جديد إلى المخزون',
    icon: Package,
    path: '/inventory',
    color: 'green'
  },
  {
    title: 'إنشاء فاتورة جديدة',
    description: 'إنشاء فاتورة مبيعات أو مشتريات',
    icon: FileText,
    path: '/invoices',
    color: 'blue'
  }
];

const colorMap = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', hover: 'hover:bg-indigo-50' },
  green: { bg: 'bg-green-50', text: 'text-green-600', hover: 'hover:bg-green-50' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'hover:bg-blue-50' }
};

export function QuickActions() {
  const { navigate } = useLocation();

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">
          إجراءات سريعة
        </h2>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map((action) => {
          const colors = colorMap[action.color];
          return (
            <button
              key={action.title}
              onClick={() => navigate(action.path)}
              className={`flex items-center p-3 sm:p-4 rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200 ${colors.hover}`}
            >
              <div className={`p-2 rounded-lg ${colors.bg} flex-shrink-0`}>
                <action.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${colors.text}`} />
              </div>
              <div className="mr-3 sm:mr-4 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {action.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
