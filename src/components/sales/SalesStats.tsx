import React from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Users } from 'lucide-react';

interface StatProps {
  title: string;
  value: string | number;
  change: string;
  color: string;
  icon: React.ElementType;
}

export function SalesStats({ title, value, change, color, icon: Icon }: StatProps) {
  // Determinar colores basados en el prop color
  const getColorClasses = (colorName: string) => {
    const colorMap: Record<string, { bg: string, text: string, iconBg: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-100' },
      green: { bg: 'bg-green-50', text: 'text-green-700', iconBg: 'bg-green-100' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', iconBg: 'bg-indigo-100' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', iconBg: 'bg-purple-100' },
      red: { bg: 'bg-red-50', text: 'text-red-700', iconBg: 'bg-red-100' },
      yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', iconBg: 'bg-yellow-100' },
    };
    
    return colorMap[colorName] || colorMap.blue;
  };
  
  const colorClasses = getColorClasses(color);
  const isPositiveChange = !change.startsWith('-');
  
  return (
    <div className={`${colorClasses.bg} rounded-lg shadow-sm border border-gray-200 p-5 transition-all hover:shadow-md`}>
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${colorClasses.iconBg} mr-4`}>
          <Icon className={`h-6 w-6 ${colorClasses.text}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline mt-1">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <span className={`ml-2 text-sm font-medium ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
              {change}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
