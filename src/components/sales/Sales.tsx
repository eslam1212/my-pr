import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { InvoiceForm } from './InvoiceForm';
import { CustomerList } from './CustomerList';
import { OrderManager } from './OrderManager';
import { ReturnsManager } from './ReturnsManager';
import { RecurringInvoices } from './RecurringInvoices';
import { saleService } from '../../services/sale.service';
import { customerService } from '../../services/customer.service';
import { orderService } from '../../services/orderService';
import { returnService } from '../../services/returnService';
import { invoiceService } from '../../services/invoice.service';
import { TrendingUp, DollarSign, ShoppingCart, Users } from 'lucide-react';
import { Sale, Customer, Order, Return, Invoice, RecurringInvoice } from '../../services/types';
import { PageWrapper } from '../layout/PageWrapper';

interface Stat {
  title: string;
  value: number | string;
  change: string;
  color: string;
  icon: React.ComponentType;
}

export function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [previousMonthSales, setPreviousMonthSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]);

  // جلب جميع المبيعات
  const fetchSales = useCallback(async () => {
    try {
      const data = await saleService.getAll();
      setSales(data);
    } catch (error) {
      console.error('Error fetching sales:', error);
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

  // جلب جميع الفواتير المتكررة
  const fetchRecurringInvoices = useCallback(async () => {
    try {
      const data = await invoiceService.getRecurringInvoices();
      setRecurringInvoices(data);
    } catch (error) {
      console.error('Error fetching recurring invoices:', error);
    }
  }, []);

  // جلب البيانات عند تحميل المكون
  useEffect(() => {
    fetchSales();
    fetchPreviousMonthSales();
    fetchCustomers();
    fetchOrders();
    fetchReturns();
    fetchInvoices();
    fetchRecurringInvoices();
  }, [
    fetchSales,
    fetchPreviousMonthSales,
    fetchCustomers,
    fetchOrders,
    fetchReturns,
    fetchInvoices,
    fetchRecurringInvoices,
  ]);

  // إضافة مبيعات جديدة
  const handleAddSale = useCallback(
    async (newSale: Sale) => {
      try {
        await saleService.create(newSale);
        fetchSales(); // تحديث قائمة المبيعات بعد الإضافة
      } catch (error) {
        console.error('Error adding sale:', error);
      }
    },
    [fetchSales]
  );

  // حساب نسبة التغيير
  const calculateChange = useCallback((current: number, previous: number): string => {
    if (previous === 0) return '+0%'; // تجنب القسمة على صفر
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  }, []);

  // حساب إجمالي الإيرادات
  const calculateTotalRevenue = useCallback((sales: Sale[]): number => {
    return sales.reduce((sum, sale) => sum + sale.total, 0);
  }, []);

  // حساب نسبة النمو
  const calculateGrowthRate = useCallback((): string => {
    const currentRevenue = calculateTotalRevenue(sales);
    const previousRevenue = calculateTotalRevenue(previousMonthSales);
    return calculateChange(currentRevenue, previousRevenue);
  }, [sales, previousMonthSales, calculateTotalRevenue, calculateChange]);

  // حساب الإحصائيات بناءً على بيانات المبيعات
  const stats: Stat[] = useMemo(() => {
    return [
      {
        title: 'إجمالي المبيعات',
        value: sales.length,
        change: calculateChange(sales.length, previousMonthSales.length),
        color: 'blue',
        icon: ShoppingCart,
      },
      {
        title: 'إجمالي الإيرادات',
        value: calculateTotalRevenue(sales),
        change: calculateChange(
          calculateTotalRevenue(sales),
          calculateTotalRevenue(previousMonthSales)
        ),
        color: 'green',
        icon: DollarSign,
      },
      {
        title: 'عدد العملاء',
        value: new Set(sales.map((sale) => sale.customer)).size,
        change: calculateChange(
          new Set(sales.map((sale) => sale.customer)).size,
          new Set(previousMonthSales.map((sale) => sale.customer)).size
        ),
        color: 'purple',
        icon: Users,
      },
      {
        title: 'نسبة النمو',
        value: calculateGrowthRate(), // نسبة النمو الحقيقية
        change: calculateGrowthRate(), // نسبة النمو الحقيقية
        color: 'orange',
        icon: TrendingUp,
      },
    ];
  }, [sales, previousMonthSales, calculateChange, calculateTotalRevenue, calculateGrowthRate]);

  return (
    <PageWrapper className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">المبيعات</h1>
          <p className="mt-2 text-sm text-gray-700">إدارة المبيعات وعرض الإحصائيات</p>
        </div>
        <NewSaleButton onAddSale={handleAddSale} />
      </div>

      <SalesStats stats={stats} />
      <SalesTable sales={sales} />

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">إدارة الفواتير</h2>
        <InvoiceForm onSuccess={() => fetchInvoices()} />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">قائمة العملاء</h2>
        <CustomerList customers={customers} />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">إدارة الطلبات</h2>
        <OrderManager orders={orders} />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">إدارة المرتجعات</h2>
        <ReturnsManager returns={returns} />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">الفواتير المتكررة</h2>
        <RecurringInvoices recurringInvoices={recurringInvoices} />
      </div>
    </PageWrapper>
  );
}
