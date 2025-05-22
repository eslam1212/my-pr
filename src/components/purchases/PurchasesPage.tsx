import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ShoppingBag, TrendingUp, Building2, DollarSign, X } from 'lucide-react';
import { purchaseService } from '../../services/purchase.service';
import { supplierService } from '../../services/supplier.service';
import { PurchaseList } from './PurchaseList';
import { PurchaseStats } from './PurchaseStats';
import { SupplierList } from './SupplierList';
import { NewPurchaseButton } from './NewPurchaseButton';
import { PurchaseForm } from './PurchaseForm';
import { Database } from '../../types/supabase';

type Purchase = Database['public']['Tables']['invoices']['Row'];
type Supplier = Database['public']['Tables']['suppliers']['Row'];

// Define the StatItem type to match PurchaseStats props
interface StatItem {
  title: string;
  value: number | string;
  change: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  icon: React.ComponentType;
}

export function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [previousMonthPurchases, setPreviousMonthPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>('purchases');

  // Fetch purchases data
  const fetchPurchases = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await purchaseService.getAll();
      setPurchases(data);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch previous month purchases
  const fetchPreviousMonthPurchases = useCallback(async () => {
    try {
      const data = await purchaseService.getPreviousMonthPurchases();
      setPreviousMonthPurchases(data);
    } catch (error) {
      console.error('Error fetching previous month purchases:', error);
    }
  }, []);

  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    try {
      const data = await supplierService.getAll();
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchPurchases();
    fetchPreviousMonthPurchases();
    fetchSuppliers();
  }, [fetchPurchases, fetchPreviousMonthPurchases, fetchSuppliers]);

  // Calculate change percentage
  const calculateChange = useCallback((current: number, previous: number): string => {
    if (previous === 0) return '+0%';
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  }, []);

  // Calculate total expenses
  const calculateTotalExpenses = useCallback((purchaseList: Purchase[]): number => {
    return purchaseList.reduce((sum, purchase) => sum + purchase.total_amount, 0);
  }, []);

  // Calculate growth rate
  const calculateGrowthRate = useCallback((): string => {
    const currentExpenses = calculateTotalExpenses(purchases);
    const previousExpenses = calculateTotalExpenses(previousMonthPurchases);
    return calculateChange(currentExpenses, previousExpenses);
  }, [purchases, previousMonthPurchases, calculateTotalExpenses, calculateChange]);

  // Purchase statistics
  const stats: StatItem[] = useMemo(() => {
    return [
      {
        title: 'إجمالي المشتريات',
        value: purchases.length,
        change: calculateChange(purchases.length, previousMonthPurchases.length),
        color: 'blue',
        icon: ShoppingBag,
      },
      {
        title: 'إجمالي المصروفات',
        value: calculateTotalExpenses(purchases),
        change: calculateChange(
          calculateTotalExpenses(purchases),
          calculateTotalExpenses(previousMonthPurchases)
        ),
        color: 'green',
        icon: DollarSign,
      },
      {
        title: 'عدد الموردين',
        value: suppliers.length,
        change: '+0%',
        color: 'purple',
        icon: Building2,
      },
      {
        title: 'نسبة النمو',
        value: calculateGrowthRate(),
        change: calculateGrowthRate(),
        color: 'orange',
        icon: TrendingUp,
      },
    ];
  }, [
    purchases, 
    previousMonthPurchases, 
    suppliers.length, 
    calculateChange, 
    calculateTotalExpenses, 
    calculateGrowthRate
  ]);

  // Handle adding a new purchase
  const handleAddPurchase = useCallback(async () => {
    setIsInvoiceFormOpen(true);
  }, []);

  // Handle view purchase details
  const handleViewPurchase = useCallback((id: string) => {
    console.log(`View purchase: ${id}`);
    // Implement view functionality
  }, []);

  // Handle edit purchase
  const handleEditPurchase = useCallback((id: string) => {
    console.log(`Edit purchase: ${id}`);
    // Implement edit functionality
  }, []);

  // Handle delete purchase
  const handleDeletePurchase = useCallback(async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      try {
        await purchaseService.delete(id);
        setPurchases(purchases.filter(purchase => purchase.id !== id));
      } catch (error) {
        console.error('Error deleting purchase:', error);
      }
    }
  }, [purchases]);

  // Handle invoice form success
  const handleInvoiceFormSuccess = useCallback(() => {
    setIsInvoiceFormOpen(false);
    fetchPurchases();
  }, [fetchPurchases]);

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">المشتريات</h1>
            <p className="mt-1 text-sm text-gray-600">إدارة المشتريات وعرض الإحصائيات</p>
          </div>
          <NewPurchaseButton onClick={handleAddPurchase} />
        </div>

        {/* Statistics */}
        <PurchaseStats stats={stats} />

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          {/* Mobile Navigation */}
          <div className="sm:hidden p-4">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as 'purchases' | 'suppliers')}
              className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="purchases">فواتير المشتريات</option>
              <option value="suppliers">الموردين</option>
            </select>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:block">
            <div className="border-b border-gray-200">
              <nav className="flex px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('purchases')}
                  className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'purchases'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  فواتير المشتريات
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

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {activeTab === 'purchases' ? (
            <PurchaseList
              onViewPurchase={handleViewPurchase}
              onEditPurchase={handleEditPurchase}
              onDeletePurchase={handleDeletePurchase}
            />
          ) : (
            <SupplierList />
          )}
        </div>
      </div>

      {/* Invoice Form Modal */}
      {isInvoiceFormOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">إنشاء فاتورة مشتريات جديدة</h3>
              <button onClick={() => setIsInvoiceFormOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <PurchaseForm onSuccess={handleInvoiceFormSuccess} />
          </div>
        </div>
      )}
    </div>
  );
}
