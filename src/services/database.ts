import { supabase } from '../lib/supabase';
import { Product, Customer, Supplier, Invoice } from '../types';

// Products
export const productService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('فشل في تحميل المنتجات');
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw new Error('فشل في تحميل بيانات المنتج');
    }
  },

  async create(product: Omit<Product, 'id'>) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error('فشل في إضافة المنتج');
    }
  },

  async update(id: string, product: Partial<Product>) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw new Error('فشل في تحديث المنتج');
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw new Error('فشل في حذف المنتج');
    }
  }
};

// تنفيذ باقي الخدمات بنفس النمط مع معالجة الأخطاء
export const customerService = {
  // ... تنفيذ مماثل
};

export const supplierService = {
  // ... تنفيذ مماثل
};

export const invoiceService = {
  // ... تنفيذ مماثل
};
