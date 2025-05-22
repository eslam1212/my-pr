import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SalesForm } from './SalesForm';
import { CustomerList } from './CustomerList';
import { OrderManager } from './OrderManager';
import { ReturnsManager } from './ReturnsManager';
import { RecurringInvoices } from './RecurringInvoices';
import { saleService } from '../../services/sale.service';
import { customerService } from '../../services/customer.service';
import { orderService } from '../../services/orderService';
import { returnService } from '../../services/returnService';
import { invoiceService } from '../../services/invoice.service';
import { TrendingUp, DollarSign, ShoppingCart, Users, FileText, X, RefreshCw } from 'lucide-react';
import { Sale, Customer, Order, Return, Invoice, RecurringInvoice } from '../../services/types';
import { NewSaleButton } from './NewSaleButton';
import { InvoiceList } from '../invoices/InvoiceList';
import { SalesStats } from './SalesStats';
import { SalesTable } from './SalesTable';
import { formatCurrency } from '../../utils/format';
import { PageWrapper } from '../layout/PageWrapper';

export function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [previousMonthSales, setPreviousMonthSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sales' | 'customers' | 'orders' | 'returns'>('sales');

  // جلب جميع المبيعات
  const fetchSales = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await saleService.getAll();
      setSales(data);
    } catch (error) {
      setError('حدث خطأ أثناء تحميل المبيعات');
      console.error('Error fetching sales:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // جلب مبيعات الشهر السابق
  const fetchPreviousMonthSales = useCallback(async () => {
    try {
      const currentDate = new Date();
      const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

      const data = await saleService.getSalesByDate(
        previousMonthStart.toISOString(),
        previousMonthEnd.toISOString()
      );
      setPreviousMonthSales(data || []);
    } catch (error) {
      console.error('Error fetching previous month sales:', error);
    }
  }, []);

  // جلب جميع العملاء
  const fetchCustomers = useCallback(async () => {
    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }, []);

  // جلب جميع الطلبات
  const fetchOrders = useCallback(async () => {
    try {
      const data = await orderService.getAll();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }, []);

  // جلب جميع المرتجعات
  const fetchReturns = useCallback(async () => {
    try {
      const data = await returnService.getAll();
      setReturns(data);
    } catch (error) {
      console.error('Error fetching returns:', error);
    }
  }, []);

  // جلب جميع الفواتير
  const fetchInvoices = useCallback(async () => {
    try {
      const data = await invoiceService.getAll();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  }, []);

  // تحديث البيانات
  const refreshData = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      await Promise.all([
        fetchSales(),
        fetchPreviousMonthSales(),
        fetchCustomers(),
        fetchOrders(),
        fetchReturns(),
        fetchInvoices(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError('حدث خطأ أثناء تحديث البيانات');
    } finally {
      setIsLoading(false);
    }
  }, [fetchSales, fetchPreviousMonthSales, fetchCustomers, fetchOrders, fetchReturns, fetchInvoices]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // حساب الإحصائيات
  const stats = useMemo(() => {
    const totalSales = sales.reduce((acc, sale) => acc + sale.total, 0);
    const previousMonthTotal = previousMonthSales.reduce((acc, sale) => acc + sale.total, 0);
    const salesChange = previousMonthTotal ? ((totalSales - previousMonthTotal) / previousMonthTotal) * 100 : 0;
    const averageOrderValue = sales.length > 0 ? totalSales / sales.length : 0;

    return [
      {
        title: 'إجمالي المبيعات',
        value: formatCurrency(totalSales),
        change: `${salesChange >= 0 ? '+' : ''}${salesChange.toFixed(1)}%`,
        color: 'blue',
        icon: DollarSign
      },
      {
        title: 'العملاء النشطون',
        value: customers.length,
        change: '+0%',
        color: 'purple',
        icon: Users
      },
      {
        title: 'الطلبات الحالية',
        value: orders.length,
        change: '+0%',
        color: 'green',
        icon: ShoppingCart
      },
      {
        title: 'متوسط قيمة الطلب',
        value: formatCurrency(averageOrderValue),
        change: '+0%',
        color: 'indigo',
        icon: TrendingUp
      }
    ];
  }, [sales, previousMonthSales, customers, orders]);

  // إغلاق نموذج الفاتورة
  const handleCloseInvoiceForm = () => {
    setIsInvoiceFormOpen(false);
  };

  // نجاح إنشاء فاتورة
  const handleInvoiceSuccess = () => {
    setIsInvoiceFormOpen(false);
    refreshData();
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-red-700">خطأ</h2>
          <button
            onClick={refreshData}
            className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4 ml-1" />
            إعادة المحاولة
          </button>
        </div>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <PageWrapper className="p-4 sm:p-6 space-y-6">
      {/* رأس الصفحة */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المبيعات</h1>
          <p className="mt-1 text-sm text-gray-500">إدارة المبيعات وعرض الإحصائيات</p>
        </div>
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <button
            onClick={refreshData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
          <NewSaleButton onClick={() => setIsInvoiceFormOpen(true)} />
        </div>
      </div>

      {isLoading && !sales.length ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* بطاقات الإحصائيات */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <SalesStats key={index} {...stat} />
            ))}
          </div>

          {/* التبويبات */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('sales')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'sales'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  المبيعات
                </button>
                <button
                  onClick={() => setActiveTab('customers')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'customers'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  العملاء
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'orders'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  الطلبات
                </button>
                <button
                  onClick={() => setActiveTab('returns')}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === 'returns'
                      ? 'border-b-2 border-indigo-500 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  المرتجعات
                </button>
              </nav>
            </div>

            <div className="p-4">
              {activeTab === 'sales' && <SalesTable sales={sales} onRefresh={refreshData} />}
              {activeTab === 'customers' && <CustomerList />}
              {activeTab === 'orders' && <OrderManager />}
              {activeTab === 'returns' && <ReturnsManager />}
            </div>
          </div>
        </div>
      )}

      {/* نموذج إنشاء فاتورة جديدة */}
      {isInvoiceFormOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">إنشاء فاتورة مبيعات جديدة</h2>
              <button
                onClick={handleCloseInvoiceForm}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <SalesForm onSuccess={handleInvoiceSuccess} />
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
