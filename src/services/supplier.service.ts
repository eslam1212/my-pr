import { BaseService } from './base.service';
import { Supplier } from '../types';
import { userService } from './userService'; // Import userService
import { AppError } from '../utils/error-handler'; // Import AppError

class SupplierService extends BaseService {
  private async checkPermission(permission: string) {
    const hasPermission = await userService.checkCurrentUserPermission(permission);
    if (!hasPermission) {
      throw new AppError(`Unauthorized: Missing permission ${permission}`, '403', 'User does not have the required permission.');
    }
  }

  async getAll() {
    // Optional: Check for 'suppliers:read' permission
    // await this.checkPermission('suppliers:read');
    return this.executeWithRetry(async () => {
      const { data, error } = await this.db
        .from('suppliers')
        .select('*');
      
      if (error) this.handleError(error, 'فشل في تحميل الموردين');
      return data || [];
    }, 'Failed to fetch suppliers');
  }

  async getById(id: string) {
    // Optional: Check for 'suppliers:read' permission
    // await this.checkPermission('suppliers:read');
    return this.executeWithRetry(async () => {
      const { data, error } = await this.db
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) this.handleError(error, 'فشل في تحميل بيانات المورد');
      return data;
    }, 'Failed to fetch supplier by ID');
  }

  async create(supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'balance'>) {
    // Removed user_id from Omit as it's not in Supplier type from DB
    // Balance is usually calculated, not directly set.
    // Contact_person, email, phone, address are part of Supplier type.
    await this.checkPermission('suppliers:create');
    return this.executeWithRetry(async () => {
      // const user = await this.getAuthenticatedUser(); // Not needed if user_id is not on suppliers table
      // if (!user) {
      //   throw new AppError("User not authenticated to create supplier.", '401', 'Authentication required.');
      // }

      // Ensure supplierData matches the table schema (name, contact_person, email, phone, address)
      const dataToInsert = {
        name: supplierData.name,
        contact_person: supplierData.contact_person || null,
        email: supplierData.email || null,
        phone: supplierData.phone || null,
        address: supplierData.address || null,
        // No user_id as per current schema
      };

      const { data: newSupplier, error } = await this.db
        .from('suppliers')
        .insert(dataToInsert)
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') { // Unique constraint violation (likely email)
            throw new AppError('فشل في إضافة المورد: البريد الإلكتروني موجود بالفعل.', '409', error.details);
        }
        this.handleError(error, 'فشل في إضافة المورد');
      }
      return newSupplier as Supplier;
    }, 'Failed to create supplier');
  }

  async update(id: string, supplierUpdates: Partial<Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'balance'>>) {
    await this.checkPermission('suppliers:update');
    return this.executeWithRetry(async () => {
      const { data: updatedSupplier, error } = await this.db
        .from('suppliers')
        .update(supplier)
        .eq('id', id)
        .select()
        .single();
      
      if (error) this.handleError(error, 'فشل في تحديث بيانات المورد');
      return updatedSupplier;
    }, 'Failed to update supplier');
  }

  async delete(id: string) {
    await this.checkPermission('suppliers:delete');
    return this.executeWithRetry(async () => {
      const { error } = await this.db
        .from('suppliers')
        .delete()
        .eq('id', id);
      
      if (error) this.handleError(error, 'فشل في حذف المورد');
      return true; // Return true on successful deletion
    }, 'Failed to delete supplier');
  }
}

export const supplierService = new SupplierService();
