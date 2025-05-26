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

  async create(supplier: Omit<Supplier, 'id' | 'user_id'>) { // user_id will be added internally
    await this.checkPermission('suppliers:create');
    return this.executeWithRetry(async () => {
      const user = await this.getAuthenticatedUser();
      if (!user) {
        throw new AppError("User not authenticated to create supplier.", '401', 'Authentication required.');
      }
      
      const supplierWithUser = {
        ...supplier,
        user_id: user.id, // Add user_id from the authenticated user
      };
      
      const { data: newSupplier, error } = await this.db
        .from('suppliers')
        .insert(supplierWithUser)
        .select()
        .single();
      
      if (error) this.handleError(error, 'فشل في إضافة المورد');
      return newSupplier;
    }, 'Failed to create supplier');
  }

  async update(id: string, supplier: Partial<Omit<Supplier, 'user_id'>>) { // user_id should not be updatable
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
