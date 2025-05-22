import React from 'react';
import { ShoppingBag, TrendingUp, Building2, DollarSign } from 'lucide-react';

interface StatItem {
  title: string;
  value: number | string;
  change: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  icon: React.ComponentType;
}

interface PurchaseStatsProps {
  stats: StatItem[];
}

export function PurchaseStats({ stats }: PurchaseStatsProps) {
  const getIconBgColor = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-600';
      case 'green':
        return 'bg-green-100 text-green-600';
      case 'purple':
        return 'bg-purple-100 text-purple-600';
      case 'orange':
        return 'bg-orange-100 text-orange-600';
      case 'red':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getChangeColor = (change: string) => {
    if (change.startsWith('+')) return 'text-green-600';
    if (change.startsWith('-')) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        
        return (
          <div key={index} className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${getIconBgColor(stat.color)} ml-4`}>
                <IconComponent className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <div className="flex items-baseline">
                  <p className="text-xl font-semibold text-gray-900">
                    {typeof stat.value === 'number' && stat.value >= 1000
                      ? stat.value.toLocaleString('ar-SA')
                      : stat.value}
                  </p>
                  <p className={`ml-2 text-sm font-medium ${getChangeColor(stat.change)}`}>
                    {stat.change}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 