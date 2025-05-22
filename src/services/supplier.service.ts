import { BaseService } from './base.service';
import { Supplier } from '../types';

class SupplierService extends BaseService {
  async getAll() {
    try {
      const { data, error } = await this.db
        .from('suppliers')
        .select('*');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return this.handleError(error, 'فشل في تحميل الموردين');
    }
  }

  async getById(id: string) {
    try {
      const { data, error } = await this.db
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return this.handleError(error, 'فشل في تحميل بيانات المورد');
    }
  }

  async create(supplier: Omit<Supplier, 'id'>) {
    try {
      const { data, error } = await this.db
        .from('suppliers')
        .insert(supplier)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return this.handleError(error, 'فشل في إضافة المورد');
    }
  }

  async update(id: string, supplier: Partial<Supplier>) {
    try {
      const { data, error } = await this.db
        .from('suppliers')
        .update(supplier)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return this.handleError(error, 'فشل في تحديث بيانات المورد');
    }
  }

  async delete(id: string) {
    try {
      const { error } = await this.db
        .from('suppliers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      return this.handleError(error, 'فشل في حذف المورد');
    }
  }
}

export const supplierService = new SupplierService();
