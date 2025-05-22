import React from 'react';
import { formatCurrency } from '../../utils/format';
import { Sale } from '../../services/types';
import { Edit, Trash2, Eye, MoreHorizontal } from 'lucide-react';
import { saleService } from '../../services/sale.service';

interface SalesTableProps {
  sales: Sale[];
  onRefresh: () => void;
}

export function SalesTable({ sales, onRefresh }: SalesTableProps) {
  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذه المبيعات؟')) {
      try {
        await saleService.delete(id);
        onRefresh();
      } catch (error) {
        console.error('Error deleting sale:', error);
        alert('حدث خطأ أثناء حذف المبيعات');
      }
    }
  };

  // تحويل تاريخ المبيعات إلى تنسيق محلي
  const formatSaleDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ar-SA');
  };

  // تحديد حالة المبيعات
  const getSaleStatus = (sale: Sale) => {
    // يمكن تعديل هذا المنطق حسب متطلبات العمل
    return {
      label: 'مكتمل',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800'
    };
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                رقم المبيعات
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                المنتج
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                العميل
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الكمية
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                السعر
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الإجمالي
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                التاريخ
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.length > 0 ? (
              sales.map((sale) => {
                const status = getSaleStatus(sale);
                return (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{sale.id?.substring(0, 8) || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(sale.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatSaleDate(sale.sale_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.bgColor} ${status.textColor}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
                        <button 
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50 transition-colors"
                          title="عرض"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50 transition-colors"
                          title="تعديل"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
                          title="حذف"
                          onClick={() => handleDelete(sale.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                  لا توجد مبيعات لعرضها
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {sales.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            إجمالي المبيعات: <span className="font-medium">{sales.length}</span>
          </div>
          <div className="text-sm text-gray-700">
            إجمالي المبلغ: <span className="font-medium">{formatCurrency(sales.reduce((sum, sale) => sum + sale.total, 0))}</span>
          </div>
        </div>
      )}
    </div>
  );
}
