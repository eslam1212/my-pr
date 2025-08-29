import React, { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../../services/inventory.service'; // Conceptual import
import { Product, StorageLocation } from '../../types';
import { useToast } from '../ui/use-toast';
import { PageWrapper } from '../layout/PageWrapper';
import { AlertTriangle, ShoppingCart, ListFilter, Info } from 'lucide-react';
import { Button } from '../ui/button'; // For potential actions like "Create PO"

// Define the structure for an alert item
export interface LowStockAlertItem {
  productId: number;
  productName: string;
  productSku?: string;
  locationId?: string | null; // UUID or null for general/unlocated
  locationName?: string | null;
  currentStock: number;
  reorderLevel: number;
  preferredStockLevel: number;
  suggestedReorderQuantity: number;
  isSerialTracked: boolean;
}

const InventoryAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<LowStockAlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLowStockAlerts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Conceptual: const data = await inventoryService.getLowStockAlerts();
      // Mock data until inventoryService.getLowStockAlerts() is fully implemented
      const mockData: LowStockAlertItem[] = [
        {
          productId: 1, productName: 'منتج ألف (مثال)', productSku: 'SKU001',
          locationId: 'loc-uuid-1', locationName: 'المخزن الرئيسي',
          currentStock: 8, reorderLevel: 10, preferredStockLevel: 50,
          suggestedReorderQuantity: 42, isSerialTracked: false,
        },
        {
          productId: 2, productName: 'منتج باء - متسلسل (مثال)', productSku: 'SKU002',
          locationId: 'loc-uuid-1', locationName: 'المخزن الرئيسي',
          currentStock: 3, reorderLevel: 5, preferredStockLevel: 10,
          suggestedReorderQuantity: 7, isSerialTracked: true,
        },
        {
          productId: 3, productName: 'منتج جيم (مثال)', productSku: 'SKU003',
          locationId: 'loc-uuid-2', locationName: 'فرع جدة',
          currentStock: 18, reorderLevel: 20, preferredStockLevel: 75,
          suggestedReorderQuantity: 57, isSerialTracked: false,
        },
         {
          productId: 4, productName: 'منتج دال - لا يوجد مخزون كاف (مثال)', productSku: 'SKU004',
          locationId: null, locationName: 'غير محدد (عام)', // Example of general product alert
          currentStock: 2, reorderLevel: 5, preferredStockLevel: 20,
          suggestedReorderQuantity: 18, isSerialTracked: false,
        },
      ];
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 700));

      // Replace with actual service call when available:
      // setAlerts(data);
      setAlerts(mockData);
      if (mockData.length === 0) {
        toast({ title: 'لا تنبيهات', description: 'مستوى المخزون جيد حاليًا.', variant: 'info' });
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل في تحميل تنبيهات المخزون المنخفض.';
      setError(msg);
      toast({ title: 'خطأ', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLowStockAlerts();
  }, [fetchLowStockAlerts]);

  if (isLoading) {
    return <PageWrapper><div className="p-6 text-center">جاري تحميل تنبيهات المخزون...</div></PageWrapper>;
  }

  if (error) {
    return <PageWrapper><div className="p-6 text-center text-red-500">خطأ: {error}</div></PageWrapper>;
  }

  return (
    <PageWrapper className="p-4 md:p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
          <AlertTriangle className="h-6 w-6 ml-2 text-orange-500" /> تنبيهات المخزون المنخفض
        </h1>
        <Button onClick={fetchLowStockAlerts} variant="outline" disabled={isLoading}>
          <ListFilter className="h-4 w-4 ml-1" /> تحديث القائمة
        </Button>
      </div>

      {alerts.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 py-10 bg-white shadow rounded-lg">
          <Info className="h-12 w-12 mx-auto text-green-500 mb-3" />
          <p className="text-lg">لا توجد تنبيهات حالية.</p>
          <p>جميع مستويات المخزون ضمن الحدود المسموح بها.</p>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 uppercase">المنتج</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 uppercase">الموقع</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 uppercase">المخزون الحالي</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 uppercase">حد إعادة الطلب</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 uppercase">الكمية المقترحة للطلب</th>
                  {/* <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase">إجراء</th> */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {alerts.map((alert) => (
                  <tr key={`${alert.productId}-${alert.locationId || 'general'}`} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-800">{alert.productName}</div>
                      <div className="text-xs text-gray-500">{alert.productSku} {alert.isSerialTracked ? "(متسلسل)" : ""}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {alert.locationName || 'غير محدد (عام)'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-red-600 font-medium">{alert.currentStock}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{alert.reorderLevel}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-blue-600 font-medium">{alert.suggestedReorderQuantity}</td>
                    {/* <td className="px-4 py-3 whitespace-nowrap text-left">
                      <Button size="sm" variant="outline" onClick={() => alert(`Create PO for ${alert.productName}`)}>
                        <ShoppingCart className="h-4 w-4 ml-1" /> إنشاء طلب شراء
                      </Button>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default InventoryAlertsPage;
