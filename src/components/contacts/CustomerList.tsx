import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Plus, User } from 'lucide-react'; // تمت إضافة User هنا
import { customerService } from '../../services/customer.service';
import { Customer } from '../../types';
import { CustomerForm } from './CustomerForm';

interface CustomerListProps {
  searchQuery?: string;
}

export function CustomerList({ searchQuery = '' }: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 5;

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await customerService.getAll();
        setCustomers(data);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };

    fetchCustomers();
  }, []);

  // Use external searchQuery if provided
  useEffect(() => {
    if (searchQuery !== undefined) {
      setLocalSearchTerm(searchQuery);
    }
  }, [searchQuery]);

  const handleAddCustomer = async (customer: Omit<Customer, 'id'>) => {
    try {
      const newCustomer = await customerService.create(customer);
      setCustomers([...customers, newCustomer]);
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('حدث خطأ أثناء إضافة العميل');
    }
  };

  const handleUpdateCustomer = async (id: string, customer: Partial<Customer>) => {
    try {
      const updatedCustomer = await customerService.update(id, customer);
      setCustomers(customers.map(c => c.id === id ? updatedCustomer : c));
      setIsFormOpen(false);
      setEditingCustomer(null);
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('حدث خطأ أثناء تحديث العميل');
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      await customerService.delete(customerId);
      setCustomers(customers.filter(customer => customer.id !== customerId));
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('حدث خطأ أثناء حذف العميل');
    }
  };

  const effectiveSearchTerm = searchQuery !== undefined ? searchQuery : localSearchTerm;

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
    customer.phone?.includes(effectiveSearchTerm)
  );

  const indexOfLastCustomer = currentPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);

  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="p-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">العملاء</h1>
          <p className="mt-2 text-sm text-gray-700">قائمة بجميع العملاء وبياناتهم</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => {
              setEditingCustomer(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة عميل جديد
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
            placeholder="البحث عن عميل..."
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
                      العميل
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      رقم الجوال
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      البريد الإلكتروني
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      الرصيد
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">إجراءات</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {currentCustomers.length > 0 ? (
                    currentCustomers.map((customer) => (
                      <tr key={customer.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <User className="h-6 w-6 text-indigo-600" />
                              </div>
                            </div>
                            <div className="mr-4">
                              <div className="font-medium text-gray-900">{customer.name}</div>
                              <div className="text-gray-500">{customer.address}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {customer.phone}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {customer.email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            customer.balance >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {customer.balance.toLocaleString('ar-SA')} ريال
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            className="text-indigo-600 hover:text-indigo-900 ml-4"
                            onClick={() => {
                              setEditingCustomer(customer);
                              setIsFormOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteCustomer(customer.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        لا يوجد عملاء للعرض
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
        <CustomerForm
          onClose={() => setIsFormOpen(false)}
          onSubmit={editingCustomer ? 
            (data) => handleUpdateCustomer(editingCustomer.id, data) : 
            handleAddCustomer}
          initialData={editingCustomer}
        />
      )}
    </div>
  );
}
