import React, { useState, useMemo } from 'react';
    import { formatCurrency, formatDate } from '../../utils/format';
    import { Search, Download } from 'lucide-react';
    
    const mockInventory = [
      { id: 1, product: 'لابتوب HP', sku: 'HP-001', quantity: 10, cost: 3000, location: 'المستودع الرئيسي' },
      { id: 2, product: 'طابعة Canon', sku: 'CN-001', quantity: 5, cost: 600, location: 'المستودع الرئيسي' },
      { id: 3, product: 'شاشة LG', sku: 'LG-001', quantity: 15, cost: 500, location: 'المعرض' },
      { id: 4, product: 'لوحة مفاتيح', sku: 'KB-001', quantity: 20, cost: 100, location: 'المستودع الرئيسي' },
      { id: 5, product: 'فأرة لاسلكية', sku: 'MS-001', quantity: 30, cost: 50, location: 'المعرض' },
      { id: 6, product: 'أرز', sku: 'RI-001', quantity: 50, cost: 20, location: 'المخزن' },
      { id: 7, product: 'سكر', sku: 'SU-001', quantity: 100, cost: 10, location: 'المخزن' },
      { id: 8, product: 'زيت', sku: 'OI-001', quantity: 20, cost: 15, location: 'المخزن' },
    ];
    
    export function InventoryReports() {
      const [inventory, setInventory] = useState(mockInventory);
      const [searchTerm, setSearchTerm] = useState('');
      const [selectedLocation, setSelectedLocation] = useState('');
      const [selectedCategory, setSelectedCategory] = useState('');
    
      const filteredInventory = useMemo(() => {
        return inventory.filter(item =>
          item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (selectedLocation ? item.location === selectedLocation : true)
        );
      }, [inventory, searchTerm, selectedLocation]);
    
      const totalInventoryValue = useMemo(() => {
        return filteredInventory.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
      }, [filteredInventory]);
    
      const uniqueLocations = useMemo(() => {
        return [...new Set(mockInventory.map(item => item.location))];
      }, []);
    
      return (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            تقارير المخزون
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
                {uniqueLocations.map(location => (
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
                    الكمية
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                    التكلفة
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                    الموقع
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                      {item.product}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 sm:px-6">
                      {item.sku}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                      {formatCurrency(item.cost)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                      {item.location}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
    
          <div className="mt-6 p-4 bg-gray-100 rounded-md">
            <h3 className="text-lg font-medium text-gray-900">
              إجمالي قيمة المخزون:
            </h3>
            <p className="text-2xl font-bold text-indigo-600">
              {formatCurrency(totalInventoryValue)}
            </p>
          </div>
        </div>
      );
    }
