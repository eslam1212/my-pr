import React, { useState, useEffect } from 'react';
import { CustomerList } from './CustomerList';
import { SupplierList } from './SupplierList';
import { Search, Filter, Users, Building2, Phone } from 'lucide-react';
import { customerService } from '../../services/customer.service';
import { supplierService } from '../../services/supplier.service';
import { PageWrapper } from '../layout/PageWrapper';

export function ContactsPage() {
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalSuppliers: 0,
    customerBalance: 0,
    supplierBalance: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const customers = await customerService.getAll();
        const suppliers = await supplierService.getAll();
        
        const customerBalance = customers.reduce((sum, customer) => sum + (customer.balance || 0), 0);
        const supplierBalance = suppliers.reduce((sum, supplier) => sum + (supplier.balance || 0), 0);
        
        setStats({
          totalCustomers: customers.length,
          totalSuppliers: suppliers.length,
          customerBalance,
          supplierBalance
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <PageWrapper className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">جهات الاتصال</h1>
                <p className="mt-1 text-sm text-gray-600">
                  إدارة العملاء والموردين
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="text-sm text-gray-600 border border-gray-200 rounded-lg px-4 py-2 bg-gray-50">
                  {activeTab === 'customers' ? 'قسم العملاء' : 'قسم الموردين'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-50 mr-4">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي العملاء</p>
                <p className="text-xl font-semibold text-gray-900">{stats.totalCustomers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-50 mr-4">
                <Building2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الموردين</p>
                <p className="text-xl font-semibold text-gray-900">{stats.totalSuppliers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-50 mr-4">
                <Phone className="h-6 w-6 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">رصيد العملاء</p>
                <p className={`text-xl font-semibold ${stats.customerBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.customerBalance.toLocaleString('ar-SA')} ريال
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-amber-50 mr-4">
                <Phone className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">رصيد الموردين</p>
                <p className="text-xl font-semibold text-red-600">
                  {Math.abs(stats.supplierBalance).toLocaleString('ar-SA')} ريال
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          {/* Mobile Navigation */}
          <div className="sm:hidden p-4">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="customers">العملاء</option>
              <option value="suppliers">الموردين</option>
            </select>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:block">
            <div className="border-b border-gray-200">
              <nav className="flex px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('customers')}
                  className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'customers'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  العملاء
                </button>
                <button
                  onClick={() => setActiveTab('suppliers')}
                  className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'suppliers'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  الموردين
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full rounded-md border-gray-300 pr-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder={`البحث في ${activeTab === 'customers' ? 'العملاء' : 'الموردين'}...`}
                />
              </div>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <Filter className="ml-2 h-5 w-5 text-gray-400" />
                تصفية
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {activeTab === 'customers' ? 
            <CustomerList searchQuery={searchQuery} /> : 
            <SupplierList searchQuery={searchQuery} />
          }
        </div>
      </div>
    </PageWrapper>
  );
}
