import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Plus, Building2 } from 'lucide-react';
import { supplierService } from '../../services/supplier.service';
import { Supplier } from '../../types';
import { SupplierForm } from './SupplierForm';

interface SupplierListProps {
  searchQuery?: string;
}

export function SupplierList({ searchQuery = '' }: SupplierListProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const suppliersPerPage = 5;

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const data = await supplierService.getAll();
        setSuppliers(data);
      } catch (error) {
        console.error('Error fetching suppliers:', error);
      }
    };

    fetchSuppliers();
  }, []);

  // Use external searchQuery if provided
  useEffect(() => {
    if (searchQuery !== undefined) {
      setLocalSearchTerm(searchQuery);
    }
  }, [searchQuery]);

  const handleAddSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    try {
      const newSupplier = await supplierService.create(supplier);
      setSuppliers([...suppliers, newSupplier]);
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error adding supplier:', error);
      alert('حدث خطأ أثناء إضافة المورد');
    }
  };

  const handleUpdateSupplier = async (id: string, supplier: Partial<Supplier>) => {
    try {
      const updatedSupplier = await supplierService.update(id, supplier);
      setSuppliers(suppliers.map(s => s.id === id ? updatedSupplier : s));
      setIsFormOpen(false);
      setEditingSupplier(null);
    } catch (error) {
      console.error('Error updating supplier:', error);
      alert('حدث خطأ أثناء تحديث المورد');
    }
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    try {
      await supplierService.delete(supplierId);
      setSuppliers(suppliers.filter(supplier => supplier.id !== supplierId));
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert('حدث خطأ أثناء حذف المورد');
    }
  };

  const effectiveSearchTerm = searchQuery !== undefined ? searchQuery : localSearchTerm;

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
    supplier.phone?.includes(effectiveSearchTerm)
  );

  const indexOfLastSupplier = currentPage * suppliersPerPage;
  const indexOfFirstSupplier = indexOfLastSupplier - suppliersPerPage;
  const currentSuppliers = filteredSuppliers.slice(indexOfFirstSupplier, indexOfLastSupplier);

  const totalPages = Math.ceil(filteredSuppliers.length / suppliersPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="p-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">الموردين</h1>
          <p className="mt-2 text-sm text-gray-700">
            قائمة بجميع الموردين وبياناتهم وأرصدتهم
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => {
              setEditingSupplier(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة مورد جديد
          </button>
        </div>
      </div>

      {searchQuery === undefined && (
        <div className="mt-6 relative">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="البحث عن مورد..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            className="block w-full pr-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      )}

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-right text-sm font-semibold text-gray-900">
                      المورد
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      رقم الجوال
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      البريد الإلكتروني
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      الرصيد المستحق
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">إجراءات</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {currentSuppliers.length > 0 ? (
                    currentSuppliers.map((supplier) => (
                      <tr key={supplier.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-orange-600" />
                              </div>
                            </div>
                            <div className="mr-4">
                              <div className="font-medium text-gray-900">{supplier.name}</div>
                              <div className="text-gray-500">{supplier.address}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {supplier.phone}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {supplier.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className="inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800">
                            {Math.abs(supplier.balance).toLocaleString('ar-SA')} ريال
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            className="text-indigo-600 hover:text-indigo-900 ml-4"
                            onClick={() => {
                              setEditingSupplier(supplier);
                              setIsFormOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteSupplier(supplier.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        لا يوجد موردين للعرض
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
            <button
              key={pageNumber}
              onClick={() => paginate(pageNumber)}
              className={`mx-1 px-3 py-1 rounded-md border ${
                currentPage === pageNumber
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {pageNumber}
            </button>
          ))}
        </div>
      )}

      {isFormOpen && (
        <SupplierForm
          onClose={() => setIsFormOpen(false)}
          onSubmit={editingSupplier ? 
            (data) => handleUpdateSupplier(editingSupplier.id, data) : 
            handleAddSupplier}
          initialData={editingSupplier}
        />
      )}
    </div>
  );
}
