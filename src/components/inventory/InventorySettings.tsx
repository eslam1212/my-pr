import React, { useState } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { UnitForm } from './UnitForm';
import { CategoryForm } from './CategoryForm';
import { useSettingsStore } from '@/store/settingsStore';
import { PageWrapper } from '../layout/PageWrapper';

export function InventorySettings() {
  const [units, setUnits] = useState(['قطعة', 'كيلوجرام', 'كرتونة', 'طن', 'شوال']);
  const [categories, setCategories] = useState([
    { id: 1, name: 'إلكترونيات', description: 'أجهزة إلكترونية متنوعة' },
    { id: 2, name: 'أثاث', description: 'أثاث منزلي ومكتبي' },
    { id: 3, name: 'ملابس', description: 'ملابس متنوعة' },
  ]);
  const [isUnitFormOpen, setIsUnitFormOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  const handleAddUnit = (newUnit: any) => {
    setUnits([...units, newUnit.name]);
    setIsUnitFormOpen(false);
  };

  const handleUpdateUnit = (updatedUnit: any) => {
    setUnits(units.map(unit => unit === editingUnit ? updatedUnit.name : unit));
    setIsUnitFormOpen(false);
    setEditingUnit(null);
  };

  const handleDeleteUnit = (unit: string) => {
    setUnits(units.filter(u => u !== unit));
  };

  const handleEditUnit = (unit: string) => {
    setEditingUnit(unit);
    setIsUnitFormOpen(true);
  };

  const handleAddCategory = (newCategory: any) => {
    setCategories([...categories, { 
      id: categories.length + 1, 
      name: newCategory.name,
      description: newCategory.description || ''
    }]);
    setIsCategoryFormOpen(false);
  };

  const handleUpdateCategory = (updatedCategory: any) => {
    setCategories(categories.map(category => 
      category.id === editingCategory.id 
        ? { ...category, name: updatedCategory.name, description: updatedCategory.description || '' }
        : category
    ));
    setIsCategoryFormOpen(false);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (categoryId: number) => {
    setCategories(categories.filter(c => c.id !== categoryId));
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setIsCategoryFormOpen(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">إعدادات المخزون</h2>
      <p className="text-gray-500">
        هنا يمكنك إدارة إعدادات المخزون المختلفة مثل الوحدات والتصنيفات
      </p>
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-md font-medium text-gray-900">
            إعدادات الوحدات
          </h3>
          <button
            onClick={() => {
              setEditingUnit(null);
              setIsUnitFormOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة وحدة
          </button>
        </div>
        <p className="text-gray-500">
          هنا يمكنك إضافة أو تعديل وحدات القياس المستخدمة في المخزون
        </p>
        <ul className="mt-2 space-y-1">
          {units.map(unit => (
            <li key={unit} className="text-sm text-gray-700 flex items-center justify-between">
              {unit}
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={() => handleEditUnit(unit)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteUnit(unit)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-md font-medium text-gray-900">
            إعدادات التصنيفات
          </h3>
          <button
            onClick={() => {
              setEditingCategory(null);
              setIsCategoryFormOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة تصنيف
          </button>
        </div>
        <p className="text-gray-500">
          هنا يمكنك إضافة أو تعديل تصنيفات المنتجات
        </p>
        <ul className="mt-2 space-y-1">
          {categories.map(category => (
            <li key={category.id} className="text-sm text-gray-700 flex items-center justify-between">
              {category.name}
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={() => handleEditCategory(category)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {isUnitFormOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <PageWrapper className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{editingUnit ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}</h3>
              <button onClick={() => setIsUnitFormOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <UnitForm
              onSubmit={editingUnit ? handleUpdateUnit : handleAddUnit}
              onClose={() => setIsUnitFormOpen(false)}
              initialData={editingUnit ? { name: editingUnit } : null}
            />
          </PageWrapper>
        </div>
      )}
      {isCategoryFormOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <PageWrapper className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{editingCategory ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}</h3>
              <button onClick={() => setIsCategoryFormOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <CategoryForm
              onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory}
              onClose={() => setIsCategoryFormOpen(false)}
              initialData={editingCategory}
            />
          </PageWrapper>
        </div>
      )}
    </div>
  );
}
