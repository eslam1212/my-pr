import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../utils/format';
import { Search, Edit, AlertTriangle } from 'lucide-react';
import { ProductUnit } from '../../types';

const mockReorderAlerts = [
  { id: 1, product: 'لابتوب HP', sku: 'HP-001', quantity: 2, minQuantity: 5, location: 'المستودع الرئيسي', unit: 'piece' as ProductUnit },
  { id: 2, product: 'طابعة Canon', sku: 'CN-001', quantity: 1, minQuantity: 3, location: 'المستودع الرئيسي', unit: 'piece' as ProductUnit },
  { id: 3, product: 'شاشة LG', sku: 'LG-001', quantity: 3, minQuantity: 10, location: 'المعرض', unit: 'piece' as ProductUnit },
  { id: 4, product: 'أرز', sku: 'RI-001', quantity: 10, minQuantity: 20, location: 'المخزن', unit: 'kilogram' as ProductUnit },
  { id: 5, product: 'سكر', sku: 'SU-001', quantity: 15, minQuantity: 30, location: 'المخزن', unit: 'kilogram' as ProductUnit },
];

const unitLabels: Record<ProductUnit, string> = {
  piece: 'قطعة',
  kilogram: 'كيلوجرام',
  box: 'كرتونة',
  ton: 'طن',
  sack: 'شوال',
};

export function ReorderAlerts() {
  const [alerts, setAlerts] = useState(mockReorderAlerts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert =>
      alert.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (selectedLocation ? alert.location === selectedLocation : true)
    );
  }, [alerts, searchTerm, selectedLocation]);

  const handleEditThreshold = (alert: any) => {
    console.log('Editing threshold for:', alert);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        تنبيهات إعادة الطلب
      </h2>

      <div className="flex flex-col sm:flex-row items-center mb-4 space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-reverse">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="البحث عن منتج أو رمز..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pr-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="location" className="text-sm text-gray-700 ml-2">الموقع:</label>
          <select
            id="location"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
          >
            <option value="">الكل</option>
            {['المستودع الرئيسي', 'المعرض', 'المخزن'].map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                المنتج
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                رمز المنتج
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                الكمية الحالية
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                الحد الأدنى
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                الوحدة
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                الموقع
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">إجراءات</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAlerts.map((alert) => (
              <tr key={alert.id}>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                  {alert.product}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 sm:px-6">
                  {alert.sku}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                  {alert.quantity}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                  {alert.minQuantity}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                  {unitLabels[alert.unit]}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                  {alert.location}
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <button
                    onClick={() => handleEditThreshold(alert)}
                    className="text-indigo-600 hover:text-indigo-900 ml-4"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
