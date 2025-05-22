import React, { useState, useMemo } from 'react';
import { formatCurrency, formatDate } from '../../utils/format';
import { Search, Edit, Trash2, Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const mockCosts = [
  { id: 1, date: '2024-03-15', category: 'مواد', description: 'شراء مواد بناء', amount: 1500 },
  { id: 2, date: '2024-03-10', category: 'عمالة', description: 'أجور العمال', amount: 3000 },
  { id: 3, date: '2024-03-05', category: 'أخرى', description: 'مصاريف إضافية', amount: 200 },
  { id: 4, date: '2024-02-28', category: 'مواد', description: 'شراء مواد بناء', amount: 1200 },
  { id: 5, date: '2024-02-20', category: 'عمالة', description: 'أجور العمال', amount: 2500 },
  { id: 6, date: '2024-02-10', category: 'أخرى', description: 'مصاريف إضافية', amount: 100 },
];

const costSchema = z.object({
  date: z.string().min(1, 'التاريخ مطلوب'),
  category: z.string().min(3, 'التصنيف يجب أن يكون 3 أحرف على الأقل'),
  description: z.string().optional(),
  amount: z.number().min(0, 'المبلغ يجب أن يكون أكبر من أو تساوي صفر'),
});

type CostFormData = z.infer<typeof costSchema>;

export function CostTracker() {
  const [costs, setCosts] = useState(mockCosts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<any>(null);
  const [categories, setCategories] = useState(['مواد', 'عمالة', 'أخرى']);
  const [newCategory, setNewCategory] = useState('');

  const filteredCosts = useMemo(() => {
    return costs.filter(cost =>
      cost.description?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory ? cost.category === selectedCategory : true)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [costs, searchTerm, selectedCategory]);

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory('');
    }
  };

  const handleEditCost = (cost: any) => {
    setEditingCost(cost);
    setIsFormOpen(true);
  };

  const handleDeleteCost = (id: number) => {
    setCosts(costs.filter(cost => cost.id !== id));
  };

  const handleAddCost = (newCost: CostFormData) => {
    setCosts([...costs, { ...newCost, id: Date.now() }]);
    setIsFormOpen(false);
  };

  const handleUpdateCost = (updatedCost: CostFormData) => {
    setCosts(costs.map(cost => cost.id === editingCost.id ? { ...cost, ...updatedCost } : cost));
    setIsFormOpen(false);
    setEditingCost(null);
  };

  const totalCost = useMemo(() => {
    return filteredCosts.reduce((sum, cost) => sum + cost.amount, 0);
  }, [filteredCosts]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            تتبع التكاليف
          </h2>
          <p className="text-gray-500">
            هنا يمكنك إدارة وتتبع تكاليف المشروع
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => {
              setEditingCost(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة مصروف
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center mb-4 space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-reverse">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="البحث عن مصروف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pr-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="category" className="text-sm text-gray-700 ml-2">التصنيف:</label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
          >
            <option value="">الكل</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto mt-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                التاريخ
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                التصنيف
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                الوصف
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                المبلغ
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">إجراءات</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCosts.map((cost) => (
              <tr key={cost.id}>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 sm:px-6">
                  {formatDate(new Date(cost.date))}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                  {cost.category}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                  {cost.description}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                  {formatCurrency(cost.amount)}
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <button
                    onClick={() => handleEditCost(cost)}
                    className="text-indigo-600 hover:text-indigo-900 ml-4"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCost(cost.id)}
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

      <div className="mt-6 p-4 bg-gray-100 rounded-md">
        <h3 className="text-lg font-medium text-gray-900">
          إجمالي التكاليف:
        </h3>
        <p className="text-2xl font-bold text-indigo-600">
          {formatCurrency(totalCost)}
        </p>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" dir="rtl">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{editingCost ? 'تعديل المصروف' : 'إضافة مصروف جديد'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <CostForm
              onSubmit={editingCost ? handleUpdateCost : handleAddCost}
              onClose={() => setIsFormOpen(false)}
              initialData={editingCost}
              categories={categories}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface CostFormProps {
  onSubmit: (data: CostFormData) => void;
  onClose: () => void;
  initialData?: Partial<CostFormData> | null;
  categories: string[];
}

const CostForm: React.FC<CostFormProps> = ({ onSubmit, onClose, initialData, categories }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CostFormData>({
    resolver: zodResolver(costSchema),
    defaultValues: initialData || {
      date: new Date().toISOString().split('T')[0],
    }
  });

  React.useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: CostFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
        <input
          {...register('date')}
          type="date"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
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
        <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
        <input
          {...register('description')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
        <input
          {...register('amount', { valueAsNumber: true })}
          type="number"
          step="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
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
