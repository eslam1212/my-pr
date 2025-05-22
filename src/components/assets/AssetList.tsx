import React, { useState, useMemo } from 'react';
import { formatCurrency, formatDate } from '../../utils/format';
import { Search, Edit, Trash2, Plus, Landmark } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const mockAssets = [
  { id: 1, name: 'لابتوب HP', category: 'أجهزة', purchaseDate: '2024-03-15', value: 3500, location: 'المكتب الرئيسي' },
  { id: 2, name: 'طابعة Canon', category: 'أجهزة', purchaseDate: '2024-03-10', value: 800, location: 'المكتب الرئيسي' },
  { id: 3, name: 'سيارة نقل', category: 'مركبات', purchaseDate: '2024-02-28', value: 50000, location: 'المستودع' },
  { id: 4, name: 'أثاث مكتبي', category: 'أثاث', purchaseDate: '2024-02-15', value: 2000, location: 'المكتب الرئيسي' },
  { id: 5, name: 'مكيف مركزي', category: 'تجهيزات', purchaseDate: '2024-01-31', value: 10000, location: 'المستودع' },
];

const assetSchema = z.object({
  name: z.string().min(3, 'اسم الأصل يجب أن يكون 3 أحرف على الأقل'),
  category: z.string().min(3, 'تصنيف الأصل يجب أن يكون 3 أحرف على الأقل'),
  purchaseDate: z.string().min(1, 'تاريخ الشراء مطلوب'),
  value: z.number().min(0, 'قيمة الأصل يجب أن تكون أكبر من صفر'),
  location: z.string().min(3, 'موقع الأصل يجب أن يكون 3 أحرف على الأقل'),
});

type AssetFormData = z.infer<typeof assetSchema>;

export function AssetList() {
  const [assets, setAssets] = useState(mockAssets);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [categories, setCategories] = useState(['أجهزة', 'مركبات', 'أثاث', 'تجهيزات']);
  const [newCategory, setNewCategory] = useState('');

  const filteredAssets = useMemo(() => {
    return assets.filter(asset =>
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (selectedLocation ? asset.location === selectedLocation : true)
    );
  }, [assets, searchTerm, selectedCategory, selectedLocation]);

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory('');
    }
  };

  const handleEditAsset = (asset: any) => {
    setEditingAsset(asset);
    setIsFormOpen(true);
  };

  const handleDeleteAsset = (id: number) => {
    setAssets(assets.filter(asset => asset.id !== id));
  };

  const handleAddAsset = (newAsset: any) => {
    setAssets([...assets, { ...newAsset, id: Date.now() }]);
    setIsFormOpen(false);
  };

  const handleUpdateAsset = (updatedAsset: any) => {
    setAssets(assets.map(asset => asset.id === updatedAsset.id ? updatedAsset : asset));
    setIsFormOpen(false);
    setEditingAsset(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        قائمة الأصول
      </h2>

      <div className="flex flex-col sm:flex-row items-center mb-4 space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-reverse">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="البحث عن أصل..."
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
            {['المكتب الرئيسي', 'المستودع', 'المعرض'].map(location => (
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
                اسم الأصل
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                التصنيف
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                تاريخ الشراء
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                القيمة
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
            {filteredAssets.map((asset) => (
              <tr key={asset.id}>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                  <div className="flex items-center">
                    <div className="h-8 w-8 flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Landmark className="h-5 w-5 text-indigo-600" />
                      </div>
                    </div>
                    <div className="mr-4">
                      <div className="font-medium text-gray-900">{asset.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 sm:px-6">
                  {asset.category}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 sm:px-6">
                  {formatDate(new Date(asset.purchaseDate))}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                  {formatCurrency(asset.value)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                  {asset.location}
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <button
                    onClick={() => handleEditAsset(asset)}
                    className="text-indigo-600 hover:text-indigo-900 ml-4"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAsset(asset.id)}
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">إدارة التصنيفات</h3>
        <div className="flex items-center space-x-2 space-x-reverse">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="إضافة تصنيف جديد"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
          />
          <button
            onClick={handleAddCategory}
            className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
          >
            إضافة
          </button>
        </div>
        <ul className="mt-2 space-y-1">
          {categories.map(category => (
            <li key={category} className="text-sm text-gray-700">
              {category}
            </li>
          ))}
        </ul>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" dir="rtl">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{editingAsset ? 'تعديل الأصل' : 'إضافة أصل جديد'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <AssetForm
              onSubmit={editingAsset ? handleUpdateAsset : handleAddAsset}
              onClose={() => setIsFormOpen(false)}
              initialData={editingAsset}
              categories={categories}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface AssetFormProps {
  onSubmit: (data: any) => void;
  onClose: () => void;
  initialData?: any;
  categories: string[];
}

const AssetForm: React.FC<AssetFormProps> = ({ onSubmit, onClose, initialData, categories }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(assetSchema),
    defaultValues: initialData || {
      purchaseDate: new Date().toISOString().split('T')[0],
    }
  });

  const handleFormSubmit = (data: any) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">اسم الأصل</label>
        <input
          {...register('name')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">تصنيف الأصل</label>
        <select
          {...register('category')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">اختر تصنيف</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الشراء</label>
        <input
          {...register('purchaseDate')}
          type="date"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {errors.purchaseDate && <p className="mt-1 text-sm text-red-600">{errors.purchaseDate.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">قيمة الأصل</label>
        <input
          {...register('value', { valueAsNumber: true })}
          type="number"
          step="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {errors.value && <p className="mt-1 text-sm text-red-600">{errors.value.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">الموقع</label>
        <input
          {...register('location')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
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
