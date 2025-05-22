import React, { useState, useMemo } from 'react';
import { Search, Edit, Trash2, Plus, MapPin } from 'lucide-react';

const mockWarehouses = [
  { id: 1, name: 'المستودع الرئيسي', address: 'الرياض', contact: '0500000000' },
  { id: 2, name: 'المعرض', address: 'جدة', contact: '0555555555' },
  { id: 3, name: 'المخزن', address: 'الدمام', contact: '0533333333' },
];

export function WarehouseManager() {
  const [warehouses, setWarehouses] = useState(mockWarehouses);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null);

  const filteredWarehouses = useMemo(() => {
    return warehouses.filter(warehouse =>
      warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [warehouses, searchTerm]);

  const handleEditWarehouse = (warehouse: any) => {
    setEditingWarehouse(warehouse);
    setIsFormOpen(true);
  };

  const handleDeleteWarehouse = (id: number) => {
    setWarehouses(warehouses.filter(warehouse => warehouse.id !== id));
  };

  const handleAddWarehouse = (newWarehouse: any) => {
    setWarehouses([...warehouses, { ...newWarehouse, id: Date.now() }]);
    setIsFormOpen(false);
  };

  const handleUpdateWarehouse = (updatedWarehouse: any) => {
    setWarehouses(warehouses.map(warehouse => warehouse.id === updatedWarehouse.id ? updatedWarehouse : warehouse));
    setIsFormOpen(false);
    setEditingWarehouse(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        إدارة المستودعات
      </h2>

      <div className="flex flex-col sm:flex-row items-center mb-4 space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-reverse">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="البحث عن مستودع..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pr-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button
          onClick={() => {
            setEditingWarehouse(null);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة مستودع
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                اسم المستودع
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                العنوان
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                رقم التواصل
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">إجراءات</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredWarehouses.map((warehouse) => (
              <tr key={warehouse.id}>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                  <div className="flex items-center">
                    <div className="h-8 w-8 flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-indigo-600" />
                      </div>
                    </div>
                    <div className="mr-4">
                      <div className="font-medium text-gray-900">{warehouse.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 sm:px-6">
                  {warehouse.address}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 sm:px-6">
                  {warehouse.contact}
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <button
                    onClick={() => handleEditWarehouse(warehouse)}
                    className="text-indigo-600 hover:text-indigo-900 ml-4"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteWarehouse(warehouse.id)}
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

      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" dir="rtl">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{editingWarehouse ? 'تعديل المستودع' : 'إضافة مستودع جديد'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <WarehouseForm
              onSubmit={editingWarehouse ? handleUpdateWarehouse : handleAddWarehouse}
              onClose={() => setIsFormOpen(false)}
              initialData={editingWarehouse}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface WarehouseFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
  initialData?: any;
}

const WarehouseForm: React.FC<WarehouseFormProps> = ({ onSubmit, onClose, initialData }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: initialData || {},
  });

  const handleFormSubmit = (data: any) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">اسم المستودع</label>
        <input
          {...register('name')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
        <input
          {...register('address')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">رقم التواصل</label>
        <input
          {...register('contact')}
          type="tel"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
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
