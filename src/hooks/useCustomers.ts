import { useState, useEffect } from 'react';
import { customerService } from '../services/customer.service';
import { Customer } from '../types';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await customerService.getAll();
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل العملاء');
    } finally {
      setIsLoading(false);
    }
  };

  const addCustomer = async (customer: Omit<Customer, 'id'>) => {
    try {
      const newCustomer = await customerService.create(customer);
      setCustomers([...customers, newCustomer]);
      return newCustomer;
    } catch (err) {
      throw err instanceof Error ? err : new Error('حدث خطأ أثناء إضافة العميل');
    }
  };

  const updateCustomer = async (id: string, customer: Partial<Customer>) => {
    try {
      const updatedCustomer = await customerService.update(id, customer);
      setCustomers(customers.map(c => c.id === id ? updatedCustomer : c));
      return updatedCustomer;
    } catch (err) {
      throw err instanceof Error ? err : new Error('حدث خطأ أثناء تحديث العميل');
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      await customerService.delete(id);
      setCustomers(customers.filter(c => c.id !== id));
    } catch (err) {
      throw err instanceof Error ? err : new Error('حدث خطأ أثناء حذف العميل');
    }
  };

  return {
    customers,
    isLoading,
    error,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refresh: loadCustomers
  };
}
