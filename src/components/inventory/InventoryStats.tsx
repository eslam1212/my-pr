import React from 'react';
import { Package, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { useInventoryStats } from '../../hooks/useInventoryStats';

export function InventoryStats() {
  const stats = useInventoryStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div className="mr-4">
            <p className="text-sm text-gray-600">إجمالي المنتجات</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalProducts}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div className="mr-4">
            <p className="text-sm text-gray-600">المنتجات المتوفرة</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.inStockProducts}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-red-100 rounded-lg">
            <TrendingDown className="h-6 w-6 text-red-600" />
          </div>
          <div className="mr-4">
            <p className="text-sm text-gray-600">المنتجات منخفضة المخزون</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.lowStockProducts}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="mr-4">
            <p className="text-sm text-gray-600">تنبيهات المخزون</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.alerts}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
