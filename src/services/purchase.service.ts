import { BaseService } from './base.service';
import { Database } from '../types/supabase';

// Define types based on Supabase schema
type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];

class PurchaseService extends BaseService {
  async getAll() {
    try {
      const { data, error } = await this.db
        .from('invoices')
        .select(`
          *,
          supplier:suppliers(
            id,
            name,
            email,
            phone
          ),
          items:invoice_items(
            *,
            product:products(
              id,
              name,
              sku
            )
          )
        `)
        .eq('type', 'purchase')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return this.handleError(error, 'فشل في تحميل فواتير المشتريات');
    }
  }

  async getById(id: string) {
    try {
      const { data, error } = await this.db
        .from('invoices')
        .select(`
          *,
          supplier:suppliers(
            id,
            name,
            email,
            phone
          ),
          items:invoice_items(
            *,
            product:products(
              id,
              name,
              sku,
              cost
            )
          )
        `)
        .eq('id', id)
        .eq('type', 'purchase')
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return this.handleError(error, 'فشل في تحميل بيانات فاتورة المشتريات');
    }
  }

  async create(purchase: Omit<Invoice, 'id'> & { items: Omit<InvoiceItem, 'id' | 'invoice_id'>[]; }) {
    const { items, ...purchaseData } = purchase;
    
    // Ensure it's marked as a purchase
    const purchaseInvoice = {
      ...purchaseData,
      type: 'purchase'
    };

    try {
      // Start a transaction
      const { data: newPurchase, error: purchaseError } = await this.db
        .from('invoices')
        .insert(purchaseInvoice)
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Add invoice items
      const invoiceItems = items.map(item => ({
        invoice_id: newPurchase.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount,
        tax_amount: item.tax_amount,
        total_amount: item.total_amount
      }));

      const { error: itemsError } = await this.db
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      return this.getById(newPurchase.id);
    } catch (error) {
      return this.handleError(error, 'فشل في إنشاء فاتورة المشتريات');
    }
  }

  async update(id: string, purchase: Partial<Invoice>) {
    try {
      const { data, error } = await this.db
        .from('invoices')
        .update(purchase)
        .eq('id', id)
        .eq('type', 'purchase')
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return this.handleError(error, 'فشل في تحديث فاتورة المشتريات');
    }
  }

  async delete(id: string) {
    try {
      const { error } = await this.db
        .from('invoices')
        .delete()
        .eq('id', id)
        .eq('type', 'purchase');
      
      if (error) throw error;
    } catch (error) {
      return this.handleError(error, 'فشل في حذف فاتورة المشتريات');
    }
  }

  async getMonthlyPurchases() {
    try {
      const currentDate = new Date();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const { data, error } = await this.db
        .from('invoices')
        .select('*')
        .eq('type', 'purchase')
        .gte('date', firstDayOfMonth.toISOString().split('T')[0])
        .lte('date', lastDayOfMonth.toISOString().split('T')[0]);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return this.handleError(error, 'فشل في تحميل مشتريات الشهر الحالي');
    }
  }

  async getPreviousMonthPurchases() {
    try {
      const currentDate = new Date();
      const firstDayOfPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const lastDayOfPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
      
      const { data, error } = await this.db
        .from('invoices')
        .select('*')
        .eq('type', 'purchase')
        .gte('date', firstDayOfPrevMonth.toISOString().split('T')[0])
        .lte('date', lastDayOfPrevMonth.toISOString().split('T')[0]);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return this.handleError(error, 'فشل في تحميل مشتريات الشهر السابق');
    }
  }
}

export const purchaseService = new PurchaseService(); 