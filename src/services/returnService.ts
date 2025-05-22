import { BaseService } from './base.service';
import { Return } from './types';

class ReturnService extends BaseService {
  // جلب جميع المرتجعات
  async getAll(): Promise<Return[]> {
    return this.executeWithRetry(
      async () => {
        const { data, error } = await this.db
          .from('returns')
          .select('*');
        
        if (error) throw error;
        return data || [];
      },
      'فشل في جلب المرتجعات'
    );
  }

  // إضافة مرتجع جديد
  async create(returnItem: Return): Promise<Return> {
    return this.executeWithRetry(
      async () => {
        const { data, error } = await this.db
          .from('returns')
          .insert(returnItem)
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      'فشل في إنشاء المرتجع'
    );
  }

  // تحديث بيانات المرتجع
  async update(returnId: string, updatedReturn: Partial<Return>): Promise<Return> {
    return this.executeWithRetry(
      async () => {
        const { data, error } = await this.db
          .from('returns')
          .update(updatedReturn)
          .eq('id', returnId)
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      'فشل في تحديث المرتجع'
    );
  }

  // حذف مرتجع
  async delete(returnId: string): Promise<void> {
    return this.executeWithRetry(
      async () => {
        const { error } = await this.db
          .from('returns')
          .delete()
          .eq('id', returnId);

        if (error) throw error;
      },
      'فشل في حذف المرتجع'
    );
  }
}

export const returnService = new ReturnService();
