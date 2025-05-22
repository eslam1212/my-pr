import { BaseService } from './base.service';
import { Product } from '../types';
import { AppError } from '../utils/error-handler';

class ProductService extends BaseService {
  async getAll() {
    try {
      const { data, error } = await this.db
        .from('products')
        .select('*');
      
      if (error) {
        throw new AppError('فشل في تحميل المنتجات', error.code, error.details);
      }
      
      // Add default unit field to products
      const productsWithUnit = (data || []).map(product => ({
        ...product,
        unit: product.unit || 'piece', // Default to 'piece' if unit is missing
        minQuantity: product.min_quantity // Map min_quantity to minQuantity for frontend
      }));
      
      return productsWithUnit;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('فشل في تحميل المنتجات');
    }
  }

  async create(product: Omit<Product, 'id'>) {
    try {
      // Create a copy of the product data
      const productData = { ...product };
      
      // Remove the unit field since it doesn't exist in the database yet
      if ('unit' in productData) {
        delete (productData as any).unit;
      }
      
      // Log the data being sent to the database for debugging
      console.log('Sending product data to database:', productData);
      
      const { data, error } = await this.db
        .from('products')
        .insert(productData)
        .select()
        .single();
      
      if (error) {
        console.error('Database error details:', error);
        throw new AppError('فشل في إضافة المنتج', error.code, error.details);
      }
      
      // Add the unit back to the returned data for frontend consistency
      if (data && product.unit) {
        (data as any).unit = product.unit;
      }
      
      return data;
    } catch (error) {
      console.error('Full error object:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('فشل في إضافة المنتج');
    }
  }

  async update(id: string, product: Partial<Product>) {
    try {
      // Create a copy of the product data
      const productData = { ...product };
      
      // Remove the unit field since it doesn't exist in the database yet
      if ('unit' in productData) {
        delete (productData as any).unit;
      }
      
      // Handle minQuantity to min_quantity conversion
      if ('minQuantity' in productData && !('min_quantity' in productData)) {
        (productData as any).min_quantity = productData.minQuantity;
        delete (productData as any).minQuantity;
      }
      
      const { data, error } = await this.db
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Database error details:', error);
        throw new AppError('فشل في تحديث المنتج', error.code, error.details);
      }
      
      // Add the unit back to the returned data for frontend consistency
      if (data && product.unit) {
        (data as any).unit = product.unit;
      }
      
      return data;
    } catch (error) {
      console.error('Full error object:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('فشل في تحديث المنتج');
    }
  }

  async delete(id: string) {
    try {
      const { error } = await this.db
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new AppError('فشل في حذف المنتج', error.code, error.details);
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('فشل في حذف المنتج');
    }
  }
}

export const productService = new ProductService();
