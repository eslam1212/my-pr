import React, { useState, useEffect } from 'react';
import { Product, SerialNumber } from '../../types';
import { productService } from '../../services/product.service';
import { serialNumberService } from '../../services/serialNumberService';
import { useParams, Link } from 'react-router-dom'; // Assuming using React Router for productId
import { Button } from '../ui/button';
import { ArrowRight, Package, Tag, Barcode, ListOrdered, Hash, CheckCircle, XCircle, Clock } from 'lucide-react';
import { PageWrapper } from '../layout/PageWrapper'; // Assuming PageWrapper is suitable here
import { formatCurrency, formatDate } from '../../utils/format'; // Assuming formatDate exists
import { useToast } from '../ui/use-toast';

const ProductDetailsPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [serials, setSerials] = useState<SerialNumber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!productId) {
      setError("معرف المنتج غير متوفر.");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const productData = await productService.getById(productId);
        if (!productData) {
          throw new Error("لم يتم العثور على المنتج.");
        }
        setProduct(productData);

        if (productData.is_serial_tracked) {
          const serialsData = await serialNumberService.getSerialNumbersForProduct(productData.id);
          setSerials(serialsData);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "فشل في تحميل تفاصيل المنتج.";
        setError(msg);
        toast({ title: 'خطأ', description: msg, variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [productId, toast]);

  if (isLoading) {
    return <PageWrapper><div className="p-6 text-center">جاري تحميل تفاصيل المنتج...</div></PageWrapper>;
  }

  if (error) {
    return <PageWrapper><div className="p-6 text-center text-red-500">خطأ: {error}</div></PageWrapper>;
  }

  if (!product) {
    return <PageWrapper><div className="p-6 text-center">لم يتم العثور على المنتج.</div></PageWrapper>;
  }

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'in_stock': return <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">في المخزن</span>;
      case 'sold': return <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">مباع</span>;
      case 'defective': return <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">معيب</span>;
      case 'returned': return <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">مرتجع</span>;
      case 'transferred_out': return <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">محول للخارج</span>;
      default: return <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">{status}</span>;
    }
  };


  return (
    <PageWrapper className="p-4 md:p-6">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link to="/inventory">
            <ArrowRight className="h-4 w-4 ml-1" /> العودة إلى قائمة المنتجات
          </Link>
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-3 bg-indigo-100 rounded-full">
              <Package className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">{product.name}</h1>
              <p className="text-sm text-gray-500">{product.description || "لا يوجد وصف متاح."}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-100">
          <div className="p-4 bg-white">
            <h4 className="text-sm font-medium text-gray-500 mb-1">رمز المنتج (SKU)</h4>
            <p className="text-md font-semibold text-gray-800 flex items-center"><Tag className="h-4 w-4 mr-2 text-gray-400" /> {product.sku}</p>
          </div>
          <div className="p-4 bg-white">
            <h4 className="text-sm font-medium text-gray-500 mb-1">سعر البيع</h4>
            <p className="text-md font-semibold text-gray-800">{formatCurrency(product.price)}</p>
          </div>
          <div className="p-4 bg-white">
            <h4 className="text-sm font-medium text-gray-500 mb-1">سعر التكلفة</h4>
            <p className="text-md font-semibold text-gray-800">{formatCurrency(product.cost)}</p>
          </div>
          <div className="p-4 bg-white">
            <h4 className="text-sm font-medium text-gray-500 mb-1">الكمية الحالية</h4>
            <p className="text-md font-semibold text-gray-800 flex items-center"><ListOrdered className="h-4 w-4 mr-2 text-gray-400" /> {product.quantity} {product.unit || 'قطعة'}</p>
          </div>
          <div className="p-4 bg-white">
            <h4 className="text-sm font-medium text-gray-500 mb-1">الحد الأدنى للكمية</h4>
            <p className="text-md font-semibold text-gray-800">{product.min_quantity || 0} {product.unit || 'قطعة'}</p>
          </div>
           <div className="p-4 bg-white">
            <h4 className="text-sm font-medium text-gray-500 mb-1">الباركود</h4>
            <p className="text-md font-semibold text-gray-800 flex items-center">
              <Barcode className="h-4 w-4 mr-2 text-gray-400" /> {product.barcode || 'غير محدد'}
            </p>
          </div>
          <div className="p-4 bg-white">
            <h4 className="text-sm font-medium text-gray-500 mb-1">تتبع بالرقم التسلسلي</h4>
            <p className="text-md font-semibold text-gray-800 flex items-center">
              {product.is_serial_tracked ?
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" /> :
                <XCircle className="h-5 w-5 mr-2 text-red-500" />
              }
              {product.is_serial_tracked ? 'نعم' : 'لا'}
            </p>
          </div>
        </div>

        {product.is_serial_tracked && (
          <div className="p-6 mt-1">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">الأرقام التسلسلية المسجلة</h3>
            {serials.length > 0 ? (
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">الرقم التسلسلي</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">الحالة</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">تاريخ الإنشاء</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {serials.map(serial => (
                      <tr key={serial.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap font-mono text-gray-800 flex items-center"><Hash className="h-3 w-3 mr-1 text-gray-400" />{serial.serial_number}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{getStatusChip(serial.status)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-600 flex items-center"><Clock className="h-3 w-3 mr-1 text-gray-400" />{formatDate(serial.created_at)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-600">{serial.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">لا توجد أرقام تسلسلية مسجلة لهذا المنتج.</p>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default ProductDetailsPage;
