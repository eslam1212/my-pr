import React, { useState, useEffect } from 'react';
import { Search, FileText, Eye, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { purchaseService } from '../../services/purchase.service';
import { Database } from '../../types/supabase';

type Purchase = Database['public']['Tables']['invoices']['Row'] & {
  supplier: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
};

interface PurchaseListProps {
  onViewPurchase?: (id: string) => void;
  onEditPurchase?: (id: string) => void;
  onDeletePurchase?: (id: string) => void;
}

export function PurchaseList({ 
  onViewPurchase, 
  onEditPurchase, 
  onDeletePurchase 
}: PurchaseListProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        setIsLoading(true);
        const data = await purchaseService.getAll();
        setPurchases(data);
      } catch (error) {
        console.error('Error fetching purchases:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'مدفوعة';
      case 'pending':
        return 'قيد الانتظار';
      case 'overdue':
        return 'متأخرة';
      default:
        return status;
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      try {
        await purchaseService.delete(id);
        setPurchases(purchases.filter(purchase => purchase.id !== id));
      } catch (error) {
        console.error('Error deleting purchase:', error);
      }
    }
  };

  const filteredPurchases = purchases.filter(purchase =>
    purchase.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white shadow-sm rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="البحث في فواتير المشتريات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pr-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

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
                المورد
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                المبلغ الإجمالي
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                المبلغ المدفوع
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                الحالة
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  جاري التحميل...
                </td>
              </tr>
            ) : filteredPurchases.length > 0 ? (
              filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 ml-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {purchase.invoice_number}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {purchase.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {purchase.supplier?.name || 'غير محدد'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(purchase.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(purchase.paid_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      getStatusBadgeColor(purchase.status)
                    }`}>
                      {getStatusLabel(purchase.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-3 rtl:space-x-reverse">
                      {onViewPurchase && (
                        <button
                          onClick={() => onViewPurchase(purchase.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      {onEditPurchase && (
                        <button
                          onClick={() => onEditPurchase(purchase.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {onDeletePurchase ? (
                        <button
                          onClick={() => onDeletePurchase(purchase.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDelete(purchase.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  لا توجد فواتير مشتريات للعرض
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 