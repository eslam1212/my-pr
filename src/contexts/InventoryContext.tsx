import React, { createContext, useState, useContext } from 'react';
import { Product } from '../types';

// بيانات تجريبية للمنتجات
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'لابتوب HP',
    sku: 'HP-001',
    price: 3500,
    cost: 3000,
    quantity: 10,
    minQuantity: 3
  },
  {
    id: '2',
    name: 'طابعة Canon',
    sku: 'CN-001',
    price: 800,
    cost: 600,
    quantity: 5,
    minQuantity: 2
  }
];

interface InventoryContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(mockProducts);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const newProduct = {
      ...product,
      id: (products.length + 1).toString()
    };
    setProducts([...products, newProduct]);
  };

  const updateProduct = async (id: string, product: Partial<Product>) => {
    setProducts(products.map(p => 
      p.id === id ? { ...p, ...product } : p
    ));
  };

  const deleteProduct = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  return (
    <InventoryContext.Provider value={{ products, addProduct, updateProduct, deleteProduct }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
