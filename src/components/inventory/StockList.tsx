import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../utils/format';
import { Search, Edit, Trash2, Plus, Package } from 'lucide-react';
import { ProductUnit } from '../../types';

const mockStock = [
  { id: 1, product: 'لابتوب HP', sku: 'HP-001', quantity: 10, location: 'المستودع الرئيسي', unit: 'piece' as ProductUnit },
  { id: 2, product: 'طابعة Canon', sku: 'CN-001', quantity: 5, location: 'المستودع الرئيسي', unit: 'piece' as ProductUnit },
  { id: 3, product: 'شاشة LG', sku: 'LG-001', quantity: 15, location: 'المعرض', unit: 'piece' as ProductUnit },
  { id: 4, product: 'لوحة مفاتيح', sku: 'KB-001', quantity: 20, location: 'المستودع الرئيسي', unit: 'piece' as ProductUnit },
  { id: 5, product: 'فأرة لاسلكية', sku: 'MS-001', quantity: 30, location: 'المعرض', unit: 'piece' as ProductUnit },
  { id: 6, product: 'أرز', sku: 'RI-001', quantity: 50, location: 'المخزن', unit: 'kilogram' as ProductUnit },
  { id: 7, product: 'سكر', sku: 'SU-001', quantity: 100, location: 'المخزن', unit: 'kilogram' as ProductUnit },
  { id: 8, product: 'زيت', sku: 'OI-001', quantity: 20, location: 'المخزن', unit: 'box' as ProductUnit },
];

const unitLabels: Record<ProductUnit, string> = {
  piece: 'قطعة',
  kilogram: 'كيلوجرام',
  box: 'كرتونة',
  ton: 'طن',
  sack: 'شوال',
};

export function StockList() {
  const [stock, setStock] = useState(mockStock);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<any>(null);
  const [locations, setLocations] = useState(['المستودع الرئيسي', 'المعرض', 'المخزن']);
  const [newLocation, setNewLocation] = useState('');

  const filteredStock = useMemo(() => {
    return stock.filter(item =>
      item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (selectedLocation ? item.location === selectedLocation : true) ||
      (selectedUnit ? item.unit === selectedUnit : true)
    );
  }, [stock, searchTerm, selectedLocation, selectedUnit]);

  const handleAddLocation = () => {
    if (newLocation && !locations.includes(newLocation)) {
      setLocations([...locations, newLocation]);
      setNewLocation('');
    }
  };

  const handleEditStock = (stockItem: any) => {
    setEditingStock(stockItem);
    setIsFormOpen(true);
  };

  const handleDeleteStock = (id: number) => {
    setStock(stock.filter(item => item.id !== id));
  };

  const handleAddStock = (newStock: any) => {
    setStock([...stock, { ...newStock, id: Date.now() }]);
    setIsFormOpen(false);
  };

  const handleUpdateStock = (updatedStock: any) => {
    setStock(stock.map(item => item.id === updatedStock.id ? updatedStock : item));
    setIsFormOpen(false);
    setEditingStock(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        قائمة المخزون
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
            {locations.map(location => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="unit" className="text-sm text-gray-700 ml-2">الوحدة:</label>
          <select
            id="unit"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value as ProductUnit)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
          >
            <option value="">الكل</option>
            {Object.entries(unitLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
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
            {filteredStock.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                  <div className="flex items-center">
                    <div className="h-8 w-8 flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Package className="h-5 w-5 text-indigo-600" />
                      </div>
                    </div>
                    <div className="mr-4">
                      <div className="font-medium text-gray-900">{item.product}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 sm:px-6">
                  {item.sku}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                  {item.quantity}
                </td>
                 <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                  {unitLabels[item.unit]}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                  {item.location}
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <button
                    onClick={() => handleEditStock(item)}
                    className="text-indigo-600 hover:text-indigo-900 ml-4"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteStock(item.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">إدارة المواقع</h3>
        <div className="flex items-center space-x-2 space-x-reverse">
          <input
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            placeholder="إضافة موقع جديد"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
          />
          <button
            onClick={handleAddLocation}
            className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
          >
            إضافة
          </button>
        </div>
        <ul className="mt-2 space-y-1">
          {locations.map(location => (
            <li key={location} className="text-sm text-gray-700">
              {location}
            </li>
          ))}
        </ul>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" dir="rtl">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{editingStock ? 'تعديل المخزون' : 'إضافة مخزون جديد'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <StockForm
              onSubmit={editingStock ? handleUpdateStock : handleAddStock}
              onClose={() => setIsFormOpen(false)}
              initialData={editingStock}
              locations={locations}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface StockFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
  initialData?: any;
  locations: string[];
}

const StockForm: React.FC<StockFormProps> = ({ onSubmit, onClose, initialData, locations }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: initialData || {},
  });

  const handleFormSubmit = (data: any) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">المنتج</label>
        <input
          {...register('product')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">رمز المنتج</label>
        <input
          {...register('sku')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">الكمية</label>
        <input
          {...register('quantity', { valueAsNumber: true })}
          type="number"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">الوحدة</label>
        <select
          {...register('unit')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="piece">قطعة</option>
          <option value="kilogram">كيلوجرام</option>
          <option value="box">كرتونة</option>
          <option value="ton">طن</option>
          <option value="sack">شوال</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">الموقع</label>
        <select
          {...register('location')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">اختر موقع</option>
          {locations.map(location => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-end space-x-2 space-x-reverse">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          إلغاء
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
        >
          {initialData ? 'تحديث' : 'إضافة'}
        </button>
      </div>
    </form>
  );
};
