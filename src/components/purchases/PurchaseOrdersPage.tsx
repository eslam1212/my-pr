import React, { useState, useEffect, useCallback } from 'react';
import { PurchaseOrder, PurchaseOrderStatus } from '../../types';
import { purchaseOrderService } from '../../services/purchaseOrderService'; // Assuming this service exists
import { Button } from '../ui/button';
import { PlusCircle, List, Eye, Edit, Filter } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { PageWrapper } from '../layout/PageWrapper';
import { Link } from 'react-router-dom'; // For navigation
import { formatDate, formatCurrency } from '../../utils/format'; // Assuming these exist

const getStatusBadge = (status: PurchaseOrderStatus | string) => {
  switch (status) {
    case 'draft': return <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">مسودة</span>;
    case 'pending_approval': return <span className="px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded-full">بانتظار الموافقة</span>;
    case 'approved': return <span className="px-2 py-0.5 text-xs bg-blue-200 text-blue-800 rounded-full">تمت الموافقة</span>;
    case 'partially_received': return <span className="px-2 py-0.5 text-xs bg-orange-200 text-orange-800 rounded-full">تم الاستلام جزئيًا</span>;
    case 'fully_received': return <span className="px-2 py-0.5 text-xs bg-green-200 text-green-800 rounded-full">تم الاستلام بالكامل</span>;
    case 'cancelled': return <span className="px-2 py-0.5 text-xs bg-red-200 text-red-800 rounded-full">ملغى</span>;
    default: return <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">{status}</span>;
  }
};


const PurchaseOrdersPage: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // TODO: Add filtering state and UI if needed
  // const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | ''>('');

  const { toast } = useToast();

  const fetchPurchaseOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Implement filtering in service or client-side
      // const filters = statusFilter ? { status: statusFilter } : {};
      const data = await purchaseOrderService.listPurchaseOrders(); // Add filters when available
      setPurchaseOrders(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل في تحميل أوامر الشراء.';
      setError(errorMessage);
      toast({ title: 'خطأ', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast /*, statusFilter */]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  if (isLoading) {
    return <PageWrapper><div className="p-4 text-center">جاري تحميل أوامر الشراء...</div></PageWrapper>;
  }

  if (error) {
    return <PageWrapper><div className="p-4 text-red-500 text-center">خطأ: {error}</div></PageWrapper>;
  }

  return (
    <PageWrapper className="p-4 md:p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
          <List className="h-7 w-7 ml-2 text-indigo-600" /> إدارة أوامر الشراء
        </h1>
        <Button asChild className="flex items-center gap-2">
          <Link to="/purchases/new"> {/* Assuming this route will host PurchaseOrderForm */}
            <PlusCircle className="h-5 w-5" /> إنشاء أمر شراء جديد
          </Link>
        </Button>
      </div>

      {/* TODO: Add Filtering UI here */}
      {/* <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <Label htmlFor="statusFilter">تصفية حسب الحالة:</Label>
        <Select onValueChange={(value) => setStatusFilter(value as PurchaseOrderStatus | '')} defaultValue="">
          <SelectTrigger id="statusFilter" className="w-full md:w-1/3 mt-1">
            <SelectValue placeholder="جميع الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">جميع الحالات</SelectItem>
            <SelectItem value="draft">مسودة</SelectItem>
            <SelectItem value="pending_approval">بانتظار الموافقة</SelectItem>
            <SelectItem value="approved">تمت الموافقة</SelectItem>
            <SelectItem value="partially_received">تم الاستلام جزئيًا</SelectItem>
            <SelectItem value="fully_received">تم الاستلام بالكامل</SelectItem>
            <SelectItem value="cancelled">ملغى</SelectItem>
          </SelectContent>
        </Select>
      </div> */}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {purchaseOrders.length === 0 ? (
          <p className="text-center text-gray-500 py-10">لا توجد أوامر شراء. قم بإنشاء أمر جديد للبدء.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم أمر الشراء</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المورد</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الطلب</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجمالي</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-indigo-600">
                      <Link to={`/purchases/${po.id}`}>{po.po_number}</Link> {/* Link to PO details page */}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{po.supplier?.name || 'غير محدد'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(po.order_date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatCurrency(po.total_amount || 0)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm">{getStatusBadge(po.status)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-left text-sm font-medium space-x-1 space-x-reverse">
                      <Button variant="outline" size="sm" asChild title="عرض التفاصيل">
                         <Link to={`/purchases/${po.id}`}><Eye className="h-4 w-4" /></Link>
                      </Button>
                      {/* Edit might only be allowed for certain statuses like 'draft' */}
                      {(po.status === 'draft' || po.status === 'pending_approval') && (
                         <Button variant="outline" size="sm" asChild title="تعديل أمر الشراء">
                           <Link to={`/purchases/edit/${po.id}`}><Edit className="h-4 w-4" /></Link>
                         </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default PurchaseOrdersPage;
