import { useState, useEffect } from 'react';
import { productService } from '../services';
import { Product } from '../types';
import { AppError } from '../utils/error-handler';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      const errorMessage = err instanceof AppError ? err.message : 'حدث خطأ أثناء تحميل المنتجات';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      // Ensure product data is properly formatted for the database
      const formattedProduct = {
        ...product,
        // If min_quantity is already set (from form conversion), use it
        // Otherwise use minQuantity value
        min_quantity: product.min_quantity || product.minQuantity
      };
      
      // Remove the camelCase property if it exists to avoid duplication
      if ('minQuantity' in formattedProduct) {
        delete (formattedProduct as any).minQuantity;
      }
      
      const newProduct = await productService.create(formattedProduct);
      
      // Convert back to frontend format if needed
      const frontendProduct = {
        ...newProduct,
        minQuantity: newProduct.min_quantity,
        // Ensure unit is preserved for frontend
        unit: newProduct.unit || product.unit || 'piece'
      };
      
      setProducts(prev => [...prev, frontendProduct]);
      return frontendProduct;
    } catch (err) {
      throw err instanceof AppError ? err : new AppError('حدث خطأ أثناء إضافة المنتج');
    }
  };

  const updateProduct = async (id: string, product: Partial<Product>) => {
    try {
      // Format product data for database
      const formattedProduct = { ...product };
      
      // Handle minQuantity to min_quantity conversion
      if ('minQuantity' in formattedProduct && !('min_quantity' in formattedProduct)) {
        (formattedProduct as any).min_quantity = formattedProduct.minQuantity;
      }
      
      const updatedProduct = await productService.update(id, formattedProduct);
      
      // Convert back to frontend format
      const frontendProduct = {
        ...updatedProduct,
        minQuantity: updatedProduct.min_quantity,
        // Ensure unit is preserved for frontend
        unit: updatedProduct.unit || product.unit || 'piece'
      };
      
      setProducts(prev => prev.map(p => p.id === id ? frontendProduct : p));
      return frontendProduct;
    } catch (err) {
      throw err instanceof AppError ? err : new AppError('حدث خطأ أثناء تحديث المنتج');
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await productService.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      throw err instanceof AppError ? err : new AppError('حدث خطأ أثناء حذف المنتج');
    }
  };

  return {
    products,
    isLoading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    refresh: loadProducts
  };
}
