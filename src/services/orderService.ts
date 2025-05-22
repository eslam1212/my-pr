import { BaseService } from './base.service';
import { Order } from './types';

class OrderService extends BaseService {
  // جلب جميع الطلبات
  async getAll(): Promise<Order[]> {
    return this.executeWithRetry(
      async () => {
        const { data, error } = await this.db
          .from('orders')
          .select('*');
        
        if (error) throw error;
        return data || [];
      },
      'فشل في جلب الطلبات'
    );
  }

  // إضافة طلب جديد
  async create(order: Order): Promise<Order> {
    return this.executeWithRetry(
      async () => {
        const { data, error } = await this.db
          .from('orders')
          .insert(order)
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      'فشل في إنشاء الطلب'
    );
  }

  // تحديث بيانات الطلب
  async update(orderId: string, updatedOrder: Partial<Order>): Promise<Order> {
    return this.executeWithRetry(
      async () => {
        const { data, error } = await this.db
          .from('orders')
          .update(updatedOrder)
          .eq('id', orderId)
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      'فشل في تحديث الطلب'
    );
  }

  // حذف طلب
  async delete(orderId: string): Promise<void> {
    return this.executeWithRetry(
      async () => {
        const { error } = await this.db
          .from('orders')
          .delete()
          .eq('id', orderId);

        if (error) throw error;
      },
      'فشل في حذف الطلب'
    );
  }
}

export const orderService = new OrderService();
