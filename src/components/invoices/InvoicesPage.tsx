import React, { useState, useEffect, useCallback } from 'react';
import { invoiceService } from '../../services/invoice.service';
import { Invoice } from '../../types/supabase';
import { formatCurrency } from '../../utils/format';
import { FileText, Printer, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [activeTab, setActiveTab] = useState<'sales' | 'purchases'>('sales');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const data = await invoiceService.getAll();
        setInvoices(data);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      }
    };

    fetchInvoices();
  }, []);

  const handlePrintInvoice = () => {
    if (selectedInvoice) {
      window.print();
    }
  };

  const salesInvoices = invoices.filter(invoice => invoice.type === 'sale');
  const purchaseInvoices = invoices.filter(invoice => invoice.type === 'purchase');

  const calculateMonthlyTotals = useCallback((invoices: Invoice[]) => {
    const monthlyTotals = {};
    invoices.forEach(invoice => {
      const month = new Date(invoice.date).toLocaleString('default', { month: 'short' });
      if (!monthlyTotals[month]) {
        monthlyTotals[month] = 0;
      }
      monthlyTotals[month] += invoice.total_amount;
    });

    return Object.keys(monthlyTotals).map(month => ({
      month,
      total: monthlyTotals[month]
    }));
  }, []);

  const salesChartData = calculateMonthlyTotals(salesInvoices);
  const purchaseChartData = calculateMonthlyTotals(purchaseInvoices);

  const toggleInvoiceExpansion = (invoiceId: string) => {
    setExpandedInvoiceId(expandedInvoiceId === invoiceId ? null : invoiceId);
  };

  const renderInvoiceDetails = (invoice: Invoice) => (
    <div className="p-4 bg-gray-50 border-t border-gray-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-sm">
            <span className="font-medium">رقم الفاتورة:</span> {invoice.invoice_number}
          </p>
          <p className="text-sm">
            <span className="font-medium">النوع:</span> {invoice.type === 'sale' ? 'مبيعات' : 'مشتريات'}
          </p>
          <p className="text-sm">
            <span className="font-medium">العميل/المورد:</span> {invoice.customer?.name || invoice.supplier?.name || 'غير محدد'}
          </p>
        </div>
        <div>
          <p className="text-sm">
            <span className="font-medium">تاريخ الفاتورة:</span> {invoice.date}
          </p>
          <p className="text-sm">
            <span className="font-medium">المبلغ الإجمالي:</span> {formatCurrency(invoice.total_amount)}
          </p>
          <p className="text-sm">
            <span className="font-medium">الحالة:</span> {invoice.status}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">الفواتير</h1>
          <p className="mt-1 text-sm text-gray-700">
            عرض جميع فواتير المبيعات والمشتريات
          </p>
        </div>
        {selectedInvoice && (
          <button
            onClick={handlePrintInvoice}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Printer className="h-4 w-4 ml-2" />
            طباعة الفاتورة
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex space-x-2 space-x-reverse">
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'sales'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          فواتير المبيعات
        </button>
        <button
          onClick={() => setActiveTab('purchases')}
          className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'purchases'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          فواتير المشتريات
        </button>
      </div>

      {/* Content Grid */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Invoices List - Desktop */}
        <div className="lg:w-2/3 hidden sm:block">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      رقم الفاتورة
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      التاريخ
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {activeTab === 'sales' ? 'العميل' : 'المورد'}
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      المبلغ
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(activeTab === 'sales' ? salesInvoices : purchaseInvoices).map((invoice) => (
                    <tr
                      key={invoice.id}
                      className={`hover:bg-gray-50 cursor-pointer ${selectedInvoice?.id === invoice.id ? 'bg-indigo-50' : ''}`}
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400 ml-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {invoice.invoice_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.customer?.name || invoice.supplier?.name || 'غير محدد'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : invoice.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status === 'paid'
                            ? 'مدفوعة'
                            : invoice.status === 'pending'
                              ? 'قيد الانتظار'
                              : 'متأخرة'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Invoices List - Mobile */}
        <div className="block sm:hidden">
          <div className="space-y-4">
            {(activeTab === 'sales' ? salesInvoices : purchaseInvoices).map((invoice) => (
              <div
                key={invoice.id}
                className="bg-white shadow-sm rounded-lg overflow-hidden"
              >
                <div 
                  className="p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleInvoiceExpansion(invoice.id)}
                >
                  <div>
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 ml-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {invoice.date}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full mr-2 ${
                      invoice.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : invoice.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {invoice.status === 'paid'
                        ? 'مدفوعة'
                        : invoice.status === 'pending'
                          ? 'قيد الانتظار'
                          : 'متأخرة'}
                    </span>
                    {expandedInvoiceId === invoice.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
                {expandedInvoiceId === invoice.id && renderInvoiceDetails(invoice)}
              </div>
            ))}
          </div>
        </div>

        {/* Invoice Details - Desktop */}
        {selectedInvoice && (
          <div className="hidden lg:block lg:w-1/3">
            <div className="bg-white shadow-sm rounded-lg p-6 sticky top-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                تفاصيل الفاتورة
              </h3>
              <div className="space-y-4">
                <p>
                  <span className="font-medium">رقم الفاتورة:</span> {selectedInvoice.invoice_number}
                </p>
                <p>
                  <span className="font-medium">النوع:</span> {selectedInvoice.type === 'sale' ? 'مبيعات' : 'مشتريات'}
                </p>
                <p>
                  <span className="font-medium">العميل/المورد:</span> {selectedInvoice.customer?.name || selectedInvoice.supplier?.name || 'غير محدد'}
                </p>
                <p>
                  <span className="font-medium">تاريخ الفاتورة:</span> {selectedInvoice.date}
                </p>
                <p>
                  <span className="font-medium">المبلغ الإجمالي:</span> {formatCurrency(selectedInvoice.total_amount)}
                </p>
                <p>
                  <span className="font-medium">الحالة:</span> {selectedInvoice.status}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="mt-8 space-y-8 lg:space-y-0 lg:flex lg:gap-6">
        <div className="lg:w-1/2">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">تحليل المبيعات الشهرية</h2>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#8884d8" name="إجمالي المبيعات" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="lg:w-1/2">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">تحليل المشتريات الشهرية</h2>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={purchaseChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#82ca9d" name="إجمالي المشتريات" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
