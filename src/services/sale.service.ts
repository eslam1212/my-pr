import { supabase } from '../lib/supabase';
import { Sale } from './types';

export const saleService = {
  // جلب جميع المبيعات
  async getAll(): Promise<Sale[]> {
    try {
      const { data, error } = await supabase.from('sales').select('*');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sales:', error);
      throw error;
    }
  },

  // إضافة مبيعات جديدة
  async create(sale: Sale): Promise<Sale> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .insert(sale)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  },

  // تحديث مبيعات
  async update(saleId: string, updatedSale: Partial<Sale>): Promise<Sale> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .update(updatedSale)
        .eq('id', saleId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating sale:', error);
      throw error;
    }
  },

  // حذف مبيعات
  async delete(saleId: string): Promise<void> {
    try {
      const { error } = await supabase.from('sales').delete().eq('id', saleId);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting sale:', error);
      throw error;
    }
  },

  // جلب المبيعات بناءً على تاريخ محدد
  async getSalesByDate(startDate: string, endDate: string): Promise<Sale[]> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .gte('sale_date', startDate)
        .lte('sale_date', endDate);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sales by date:', error);
      throw error;
    }
  },
};
