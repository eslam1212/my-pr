import { useState, useEffect } from 'react';
import { supplierService } from '../services/supplier.service';
import { Supplier } from '../types';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setIsLoading(true);
      const data = await supplierService.getAll();
      setSuppliers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل الموردين');
    } finally {
      setIsLoading(false);
    }
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    try {
      const newSupplier = await supplierService.create(supplier);
      setSuppliers([...suppliers, newSupplier]);
      return newSupplier;
    } catch (err) {
      throw err instanceof Error ? err : new Error('حدث خطأ أثناء إضافة المورد');
    }
  };

  const updateSupplier = async (id: string, supplier: Partial<Supplier>) => {
    try {
      const updatedSupplier = await supplierService.update(id, supplier);
      setSuppliers(suppliers.map(s => s.id === id ? updatedSupplier : s));
      return updatedSupplier;
    } catch (err) {
      throw err instanceof Error ? err : new Error('حدث خطأ أثناء تحديث المورد');
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      await supplierService.delete(id);
      setSuppliers(suppliers.filter(s => s.id !== id));
    } catch (err) {
      throw err instanceof Error ? err : new Error('حدث خطأ أثناء حذف المورد');
    }
  };

  return {
    suppliers,
    isLoading,
    error,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    refresh: loadSuppliers
  };
}
