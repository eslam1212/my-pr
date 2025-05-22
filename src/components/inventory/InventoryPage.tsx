import React, { useState, useEffect } from 'react';
import ProductList from './ProductList';
import { NewProductButton } from './NewProductButton';
import { ProductForm } from './ProductForm';
import { useProducts } from '../../hooks/useProducts';
import { toast } from 'react-toastify';
import { productService } from '../../services/product.service';
import { StockList } from './StockList';
import { WarehouseManager } from './WarehouseManager';
import { StockTransfer } from './StockTransfer';
import { ReorderAlerts } from './ReorderAlerts';
import { PurchaseManager } from './PurchaseManager';
import { InventoryReports } from './InventoryReports';
import { InventorySettings } from './InventorySettings';
import { Menu, Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Product } from '../../types';
import { PageWrapper } from '../layout/PageWrapper';

type TabType = 'products' | 'stock' | 'warehouse' | 'transfer' | 'alerts' | 'purchases' | 'reports' | 'settings';

type ProductUnit = 'piece' | 'kilogram' | 'box' | 'ton' | 'sack';

interface ProductFormData {
  name: string;
  sku: string;
  price: number;
  cost: number;
  quantity: number;
  minQuantity: number;
  unit: ProductUnit;
  description?: string;
  min_quantity?: number;
}

const tabs: { id: TabType; label: string }[] = [
  { id: 'products', label: 'المنتجات' },
  { id: 'stock', label: 'قائمة المخزون' },
  { id: 'warehouse', label: 'إدارة المستودعات' },
  { id: 'transfer', label: 'تحويل المخزون' },
  { id: 'alerts', label: 'تنبيهات إعادة الطلب' },
  { id: 'purchases', label: 'إدارة المشتريات' },
  { id: 'reports', label: 'تقارير المخزون' },
  { id: 'settings', label: 'إعدادات المخزون' }
];

export function InventoryPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { addProduct } = useProducts();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductFormData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('products');

  const refreshProducts = async () => {
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    refreshProducts();
  }, []);

  const handleAddProduct = async (data: ProductFormData) => {
    try {
      await addProduct(data);
      setIsFormOpen(false);
      toast.success('تمت إضافة المنتج بنجاح');
      refreshProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('فشل في إضافة المنتج');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await productService.delete(productId);
      await refreshProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleEdit = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setSelectedProduct(product as unknown as ProductFormData);
      setIsFormOpen(true);
    }
  };

  const handleUpdateProduct = async (updatedProduct: ProductFormData) => {
    try {
      if (selectedProduct) {
        const productId = products.find(p => 
          p.name === selectedProduct.name && p.sku === selectedProduct.sku
        )?.id;
        
        if (productId) {
          await productService.update(productId, updatedProduct);
          toast.success('تم تحديث المنتج بنجاح');
          refreshProducts();
          setIsFormOpen(false);
          setSelectedProduct(null);
        }
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('فشل في تحديث المنتج');
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const renderSection = () => {
    switch (activeTab) {
      case 'products':
        return (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-900">قائمة المنتجات</h2>
              <NewProductButton onClick={() => setIsFormOpen(true)} />
            </div>
            <ProductList
              products={products}
              deleteProduct={handleDeleteProduct}
              onEdit={handleEdit}
            />
          </>
        );
      case 'stock':
        return <StockList />;
      case 'warehouse':
        return <WarehouseManager />;
      case 'transfer':
        return <StockTransfer />;
      case 'alerts':
        return <ReorderAlerts />;
      case 'purchases':
        return <PurchaseManager />;
      case 'reports':
        return <InventoryReports />;
      case 'settings':
        return <InventorySettings />;
      default:
        return null;
    }
  };

  // Calculate inventory stats
  const totalProducts = products.length;
  const inStockProducts = products.filter(p => p.quantity > 0).length;
  const lowStockProducts = products.filter(p => p.quantity <= (p.minQuantity || 0)).length;

  return (
    <PageWrapper className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">إدارة المخزون</h1>
            <p className="mt-1 text-sm text-gray-600">
              إدارة المنتجات والمخزون ومتابعة الكميات والتنبيهات
            </p>
          </div>
        </div>
      </div>

      {/* Stats and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Stats Cards */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">إحصائيات المخزون</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-2 bg-blue-100 rounded-full">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="mr-3">
                    <p className="text-sm font-medium text-gray-500">إجمالي المنتجات</p>
                    <p className="text-xl font-semibold text-gray-900">{totalProducts}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-2 bg-green-100 rounded-full">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="mr-3">
                    <p className="text-sm font-medium text-gray-500">متوفر في المخزون</p>
                    <p className="text-xl font-semibold text-gray-900">{inStockProducts}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-2 bg-red-100 rounded-full">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="mr-3">
                    <p className="text-sm font-medium text-gray-500">مخزون منخفض</p>
                    <p className="text-xl font-semibold text-gray-900">{lowStockProducts}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 h-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">تنبيهات إعادة الطلب</h3>
            {lowStockProducts > 0 ? (
              <div className="space-y-3">
                {products
                  .filter(p => p.quantity <= (p.minQuantity || 0))
                  .slice(0, 3)
                  .map((product) => (
                    <div key={product.id} className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex-shrink-0 p-1 bg-yellow-100 rounded-full">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="mr-3 flex-1">
                        <p className="text-sm font-medium text-yellow-800">{product.name}</p>
                        <p className="text-xs text-yellow-700">الكمية: {product.quantity} / الحد الأدنى: {product.minQuantity || 0}</p>
                      </div>
                    </div>
                  ))}
                {lowStockProducts > 3 && (
                  <button 
                    onClick={() => setActiveTab('alerts')}
                    className="w-full text-sm text-center text-indigo-600 hover:text-indigo-800 font-medium mt-2"
                  >
                    عرض كل التنبيهات ({lowStockProducts})
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">لا توجد تنبيهات حالية</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <div className="block sm:hidden mb-4">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex justify-between items-center"
        >
          <span>{tabs.find(tab => tab.id === activeTab)?.label}</span>
          <Menu className="h-5 w-5 text-gray-400" />
        </button>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full text-right px-4 py-3 text-sm transition-colors duration-150 ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Tabs */}
      <div className="hidden sm:block mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 space-x-reverse overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 sm:p-6">
          {renderSection()}
        </div>
      </div>
      
      {/* Product Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">
                  {selectedProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
                </h2>
                <button
                  onClick={() => {
                    setIsFormOpen(false);
                    setSelectedProduct(null);
                  }}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full p-1"
                >
                  <span className="sr-only">إغلاق</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <ProductForm
                onSubmit={selectedProduct ? handleUpdateProduct : handleAddProduct}
                onClose={() => {
                  setIsFormOpen(false);
                  setSelectedProduct(null);
                }}
                initialData={selectedProduct}
              />
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
