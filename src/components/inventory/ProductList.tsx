import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import { Package, Edit, Trash2 } from 'lucide-react';
import { Product, ProductUnit } from '../../types';
import { userService } from '../../services/userService'; // Import userService
import { formatCurrency } from '../../utils/format';

// تعريف تسميات الوحدات
const unitLabels: Record<ProductUnit, string> = {
  piece: 'قطعة',
  kilogram: 'كيلوجرام',
  box: 'كرتونة',
  ton: 'طن',
  sack: 'شوال',
};

// تعريف الخصائص (Props) للمكون
interface ProductListProps {
  products: Product[]; // قائمة المنتجات
  deleteProduct: (id: string) => void; // دالة الحذف
  onEdit: (id: string) => void; // دالة التعديل
}

// المكون الرئيسي
const ProductList: React.FC<ProductListProps> = ({ products, deleteProduct, onEdit }) => {
  const [canEditProducts, setCanEditProducts] = useState(false);
  const [canDeleteProducts, setCanDeleteProducts] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const editPerm = await userService.checkCurrentUserPermission('products:update');
        const deletePerm = await userService.checkCurrentUserPermission('products:delete');
        setCanEditProducts(editPerm);
        setCanDeleteProducts(deletePerm);
      } catch (error) {
        console.error("Error checking product permissions:", error);
        // Set to false if there's an error, or handle as appropriate
        setCanEditProducts(false);
        setCanDeleteProducts(false);
      }
    };
    checkPermissions();
  }, []);

  // Helper function to safely get the unit label
  const getUnitLabel = (unit: ProductUnit | undefined): string => {
    if (!unit) return 'قطعة'; // Default to 'piece' if unit is missing
    return unitLabels[unit] || 'قطعة';
  };

  return (
    <div className="bg-white shadow-sm rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                المنتج
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                رمز المنتج
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                السعر
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                الكمية
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">إجراءات</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <Package className="h-6 w-6 text-indigo-600" />
                      </div>
                    </div>
                    <div className="mr-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.sku}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(product.price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.quantity} {getUnitLabel(product.unit)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                  {canEditProducts && (
                    <button
                      onClick={() => onEdit(product.id)} // استدعاء دالة التعديل
                      className="text-indigo-600 hover:text-indigo-900 ml-4"
                      title="تعديل المنتج"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {canDeleteProducts && (
                    <button
                      onClick={() => deleteProduct(product.id)} // استدعاء دالة الحذف
                      className="text-red-600 hover:text-red-900 mr-2" // Added margin for RTL
                      title="حذف المنتج"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductList;
