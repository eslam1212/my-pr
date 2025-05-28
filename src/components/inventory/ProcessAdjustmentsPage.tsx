import React, { useState, useEffect, useCallback } from 'react';
import { InventoryAdjustment } from '../../types';
import { stockAdjustmentService } from '../../services/stockAdjustmentService';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';
import { PageWrapper } from '../layout/PageWrapper';
import { CheckCircle, RefreshCw, AlertCircle, Edit, Loader2, ListChecks, FileText } from 'lucide-react';
import { formatDate } from '../../utils/format'; // Assuming this utility exists

const ProcessAdjustmentsPage: React.FC = () => {
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({}); // For individual item processing
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUnprocessedAdjustments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await stockAdjustmentService.listInventoryAdjustments({ processed: false });
      setAdjustments(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل في تحميل التسويات غير المعالجة.';
      setError(msg);
      toast({ title: 'خطأ', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUnprocessedAdjustments();
  }, [fetchUnprocessedAdjustments]);

  const handleProcessAdjustment = async (adjustmentId: string) => {
    setIsProcessing(prev => ({ ...prev, [adjustmentId]: true }));
    try {
      await stockAdjustmentService.processInventoryAdjustment(adjustmentId);
      toast({ title: 'نجاح', description: `تمت معالجة التسوية ${adjustmentId} بنجاح.` });
      fetchUnprocessedAdjustments(); // Refresh the list
    } catch (err: any) {
      toast({ title: 'خطأ في المعالجة', description: err.message || `فشل في معالجة التسوية ${adjustmentId}.`, variant: 'destructive' });
    } finally {
      setIsProcessing(prev => ({ ...prev, [adjustmentId]: false }));
    }
  };
  
  const getAdjustmentTypeLabel = (type: string): string => {
    const types: { [key: string]: string } = {
      cycle_count: 'جرد دوري',
      physical_count: 'جرد فعلي شامل',
      initial_stock: 'رصيد افتتاحي',
      damage: 'تلف',
      theft: 'سرقة',
      correction_increase: 'تسوية زيادة',
      correction_decrease: 'تسوية نقص',
      purchase_receipt: 'استلام مشتريات',
      sale_dispatch: 'صرف مبيعات',
      stock_transfer_out: 'تحويل مخزون (خارج)',
      stock_transfer_in: 'تحويل مخزون (داخل)',
      other: 'أخرى',
    };
    return types[type] || type;
  };


  if (isLoading) {
    return <PageWrapper><div className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />جاري تحميل التسويات...</div></PageWrapper>;
  }

  if (error) {
    return <PageWrapper><div className="p-6 text-red-500 text-center">خطأ: {error}</div></PageWrapper>;
  }

  return (
    <PageWrapper className="p-4 md:p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
          <ListChecks className="h-7 w-7 ml-2 text-indigo-600" /> مراجعة ومعالجة تسويات المخزون
        </h1>
        <Button onClick={fetchUnprocessedAdjustments} variant="outline" disabled={isLoading || Object.values(isProcessing).some(s => s)}>
          <RefreshCw className={`h-4 w-4 ml-1 ${isLoading ? 'animate-spin' : ''}`} /> تحديث القائمة
        </Button>
      </div>

      {adjustments.length === 0 && !isLoading && (
        <div className="text-center text-gray-500 py-10 bg-white shadow rounded-lg">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-3" />
          <p className="text-lg">لا توجد تسويات معلقة للمراجعة.</p>
        </div>
      )}

      {adjustments.length > 0 && (
        <div className="space-y-4">
          {adjustments.map((adj) => (
            <div key={adj.id} className="bg-white shadow-md rounded-lg p-4 border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                {/* Column 1: Product & Location Info */}
                <div className="space-y-2">
                  <h3 className="text-md font-semibold text-indigo-700 flex items-center">
                    <Package className="h-5 w-5 ml-2 text-indigo-500" /> 
                    {adj.product?.name || `منتج ID: ${adj.product_id}`}
                    {adj.product?.is_serial_tracked && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full mr-2">متسلسل</span>}
                  </h3>
                  <p className="text-sm text-gray-600 flex items-center">
                    <MapPin className="h-4 w-4 ml-1 text-gray-400" /> 
                    الموقع: {adj.storage_location?.name || `موقع ID: ${adj.location_id}`}
                  </p>
                   <p className="text-sm text-gray-600 flex items-center">
                    <FileText className="h-4 w-4 ml-1 text-gray-400" /> 
                    نوع التسوية: <span className="font-medium">{getAdjustmentTypeLabel(adj.adjustment_type)}</span>
                  </p>
                </div>

                {/* Column 2: Quantities */}
                <div className="space-y-1 text-sm">
                  <p>الكمية المتوقعة: <span className="font-mono text-gray-700">{adj.expected_quantity}</span></p>
                  <p>الكمية المعدودة: <span className="font-mono font-semibold text-blue-600">{adj.counted_quantity}</span></p>
                  <p className={`font-semibold ${adj.variance > 0 ? 'text-green-600' : adj.variance < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    الفرق: <span className="font-mono">{adj.variance}</span>
                  </p>
                </div>
                
                {/* Column 3: Details & Actions */}
                <div className="space-y-2 text-sm md:text-left">
                  <p className="text-gray-500">
                    تم الجرد بواسطة: {adj.user?.username || adj.user?.email || adj.user_id || 'غير معروف'}
                  </p>
                  <p className="text-gray-500">
                    تاريخ الجرد: {formatDate(adj.counted_at)}
                  </p>
                  {adj.notes && <p className="text-gray-600 bg-gray-50 p-2 rounded text-xs border">ملاحظات: {adj.notes}</p>}
                  
                  <div className="pt-2">
                    <Button 
                      onClick={() => handleProcessAdjustment(adj.id)} 
                      disabled={isProcessing[adj.id]}
                      size="sm"
                      className="w-full md:w-auto flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      {isProcessing[adj.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                      معالجة التسوية
                    </Button>
                    {/* Optional: Edit button if adjustments can be edited before processing */}
                    {/* <Button variant="outline" size="sm" className="mt-2 md:mt-0 md:mr-2 w-full md:w-auto">
                      <Edit className="h-4 w-4 ml-1" /> تعديل
                    </Button> */}
                  </div>
                </div>
              </div>
               {adj.product?.is_serial_tracked && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-xs text-yellow-800 flex items-center">
                    <AlertCircle className="inline h-4 w-4 mr-2 flex-shrink-0" /> 
                    <span>هذا منتج يتم تتبعه بالرقم التسلسلي. المعالجة الحالية ستسجل الفرق الإجمالي. قد تحتاج إلى إجراءات يدوية لتحديث حالة الأرقام التسلسلية الفردية.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PageWrapper>
  );
};

export default ProcessAdjustmentsPage;
