import { BaseService } from './base.service';
import { Invoice, InvoiceItem } from '../types';

class InvoiceService extends BaseService {
  async getAll() {
    try {
      const { data, error } = await this.db
        .from('invoices')
        .select(`
          *,
          customer:customers(
            id,
            name,
            email,
            phone
          ),
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
        `);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return this.handleError(error, 'فشل في تحميل الفواتير');
    }
  }

  async getById(id: string) {
    try {
      const { data, error } = await this.db
        .from('invoices')
        .select(`
          *,
          customer:customers(
            id,
            name,
            email,
            phone
          ),
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
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return this.handleError(error, 'فشل في تحميل بيانات الفاتورة');
    }
  }

  async create(invoice: Omit<Invoice, 'id'> & { items: Omit<InvoiceItem, 'id'>[]; }) {
    const { items, ...invoiceData } = invoice;

    try {
      // Start a transaction
      const { data: newInvoice, error: invoiceError } = await this.db
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Add invoice items
      const { error: itemsError } = await this.db
        .from('invoice_items')
        .insert(
          items.map(item => ({
            invoice_id: newInvoice.id,
            ...item
          }))
        );

      if (itemsError) throw itemsError;

      return this.getById(newInvoice.id);
    } catch (error) {
      return this.handleError(error, 'فشل في إنشاء الفاتورة');
    }
  }

  async update(id: string, invoice: Partial<Invoice>) {
    try {
      const { data, error } = await this.db
        .from('invoices')
        .update(invoice)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return this.handleError(error, 'فشل في تحديث الفاتورة');
    }
  }

  async delete(id: string) {
    try {
      const { error } = await this.db
        .from('invoices')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      return this.handleError(error, 'فشل في حذف الفاتورة');
    }
  }
}

export const invoiceService = new InvoiceService();
