import { supabase } from '../lib/supabase';
import { Invoice, RecurringInvoice } from './types';
import { BaseService } from './base.service';

class InvoiceService extends BaseService {
  async getAll(): Promise<Invoice[]> {
    return this.executeWithRetry(
      async () => {
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            customer:customers (
              id,
              name,
              email,
              phone
            )
          `);
        
        if (error) throw error;
        return data || [];
      },
      'فشل في تحميل الفواتير'
    );
  }

  async create(invoice: Invoice): Promise<Invoice> {
    return this.executeWithRetry(
      async () => {
        const { data, error } = await supabase
          .from('invoices')
          .insert(invoice)
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      'فشل في إنشاء الفاتورة'
    );
  }

  async update(invoiceId: string, updatedInvoice: Partial<Invoice>): Promise<Invoice> {
    return this.executeWithRetry(
      async () => {
        const { data, error } = await supabase
          .from('invoices')
          .update(updatedInvoice)
          .eq('id', invoiceId)
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      'فشل في تحديث الفاتورة'
    );
  }

  async delete(invoiceId: string): Promise<void> {
    return this.executeWithRetry(
      async () => {
        const { error } = await supabase
          .from('invoices')
          .delete()
          .eq('id', invoiceId);

        if (error) throw error;
      },
      'فشل في حذف الفاتورة'
    );
  }

  async getRecurringInvoices(): Promise<RecurringInvoice[]> {
    try {
      const { data, error } = await supabase.from('recurring_invoices').select('*');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recurring invoices:', error);
      throw error;
    }
  }

  async createRecurringInvoice(invoice: RecurringInvoice): Promise<RecurringInvoice> {
    try {
      const { data, error } = await supabase
        .from('recurring_invoices')
        .insert(invoice)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating recurring invoice:', error);
      throw error;
    }
  }
}

export const invoiceService = new InvoiceService();
