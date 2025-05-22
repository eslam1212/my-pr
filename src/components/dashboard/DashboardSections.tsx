import React from 'react';
import { Users, ShoppingCart, Package, FileText, DollarSign, BarChart3 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const sections = [
  {
    title: 'العملاء والموردين',
    description: 'إدارة بيانات العملاء والموردين',
    icon: Users,
    path: '/contacts',
    color: 'indigo'
  },
  {
    title: 'المبيعات',
    description: 'إدارة عمليات البيع والفواتير',
    icon: ShoppingCart,
    path: '/sales',
    color: 'blue'
  },
  {
    title: 'المخزون',
    description: 'إدارة المنتجات والمخزون',
    icon: Package,
    path: '/inventory',
    color: 'green'
  },
  {
    title: 'الفواتير',
    description: 'إدارة الفواتير وعرضها',
    icon: FileText,
    path: '/invoices',
    color: 'purple'
  },
  {
    title: 'المالية',
    description: 'إدارة المعاملات المالية',
    icon: DollarSign,
    path: '/finance',
    color: 'pink'
  },
  {
    title: 'التقارير',
    description: 'عرض التقارير والإحصائيات',
    icon: BarChart3,
    path: '/reports',
    color: 'yellow'
  }
];

const colorMap = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', hover: 'hover:bg-indigo-50' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', hover: 'hover:bg-blue-50' },
  green: { bg: 'bg-green-50', text: 'text-green-600', hover: 'hover:bg-green-50' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', hover: 'hover:bg-purple-50' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', hover: 'hover:bg-pink-50' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', hover: 'hover:bg-yellow-50' }
};

export function DashboardSections() {
  const { navigate } = useLocation();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">
          الأقسام الرئيسية
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sections.map((section) => {
          const colors = colorMap[section.color];
          return (
            <button
              key={section.title}
              onClick={() => navigate(section.path)}
              className={`flex items-center p-3 sm:p-4 rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200 ${colors.hover}`}
            >
              <div className={`p-2 rounded-lg ${colors.bg} flex-shrink-0`}>
                <section.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${colors.text}`} />
              </div>
              <div className="mr-3 sm:mr-4 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {section.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {section.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
