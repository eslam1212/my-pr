import { supabase } from '../lib/supabase';
import { Customer } from './types';

export const customerService = {
  // جلب جميع العملاء
  async getAll(): Promise<Customer[]> {
    try {
      const { data, error } = await supabase.from('customers').select('*');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },

  // إضافة عميل جديد
  async create(customer: Customer): Promise<Customer> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  },

  // تحديث بيانات العميل
  async update(customerId: string, updatedCustomer: Partial<Customer>): Promise<Customer> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updatedCustomer)
        .eq('id', customerId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  // حذف عميل
  async delete(customerId: string): Promise<void> {
    try {
      const { error } = await supabase.from('customers').delete().eq('id', customerId);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },
};
