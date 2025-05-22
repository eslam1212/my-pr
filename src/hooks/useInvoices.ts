import { useState, useEffect } from 'react';
import { invoiceService } from '../services/invoice.service';
import { Invoice } from '../types';

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const data = await invoiceService.getAll();
      setInvoices(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل الفواتير');
    } finally {
      setIsLoading(false);
    }
  };

  const addInvoice = async (invoice: Omit<Invoice, 'id'>) => {
    try {
      const newInvoice = await invoiceService.create(invoice);
      setInvoices([...invoices, newInvoice]);
      return newInvoice;
    } catch (err) {
      throw err instanceof Error ? err : new Error('حدث خطأ أثناء إضافة الفاتورة');
    }
  };

  const updateInvoice = async (id: string, invoice: Partial<Invoice>) => {
    try {
      const updatedInvoice = await invoiceService.update(id, invoice);
      setInvoices(invoices.map(i => i.id === id ? updatedInvoice : i));
      return updatedInvoice;
    } catch (err) {
      throw err instanceof Error ? err : new Error('حدث خطأ أثناء تحديث الفاتورة');
    }
  };

  const deleteInvoice = async (id: string) => {
    try {
      await invoiceService.delete(id);
      setInvoices(invoices.filter(i => i.id !== id));
    } catch (err) {
      throw err instanceof Error ? err : new Error('حدث خطأ أثناء حذف الفاتورة');
    }
  };

  return {
    invoices,
    isLoading,
    error,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    refresh: loadInvoices
  };
}
