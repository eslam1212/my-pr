import { BaseService } from './base.service';
import { Customer } from '../types';
import { userService } from './userService'; // Import userService
import { AppError } from '../utils/error-handler'; // Import AppError

class CustomerService extends BaseService {
  private async checkPermission(permission: string) {
    const hasPermission = await userService.checkCurrentUserPermission(permission);
    if (!hasPermission) {
      throw new AppError(`Unauthorized: Missing permission ${permission}`, '403', 'User does not have the required permission.');
    }
  }

  async getAll() {
    // Optional: Check for 'customers:read' permission
    // await this.checkPermission('customers:read');
    return this.executeWithRetry(async () => {
      const { data: customers, error } = await this.db
        .from('customers')
        .select('*');
      
      if (error) {
        console.error("Error fetching customers:", error);
        this.handleError(error, 'فشل في تحميل العملاء');
      }
      return customers || [];
    }, 'Failed to fetch customers');
  }

  async getById(id: string) {
    // Optional: Check for 'customers:read' permission
    // await this.checkPermission('customers:read');
    return this.executeWithRetry(async () => {
      const { data: customer, error } = await this.db
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) this.handleError(error, 'فشل في تحميل بيانات العميل');
      return customer;
    }, 'Failed to fetch customer by ID');
  }

  async create(customer: Omit<Customer, 'id' | 'user_id'>) { // user_id will be added internally
    await this.checkPermission('customers:create');
    return this.executeWithRetry(async () => {
      const user = await this.getAuthenticatedUser();
      if (!user) {
        throw new AppError("User not authenticated to create customer.", '401', 'Authentication required.');
      }
      
      const customerWithUser = {
        ...customer,
        user_id: user.id, // Add user_id from the authenticated user
      };
      
      const { data: newCustomer, error } = await this.db
        .from('customers')
        .insert(customerWithUser)
        .select()
        .single();
      
      if (error) this.handleError(error, 'فشل في إضافة العميل');
      return newCustomer;
    }, 'Failed to create customer');
  }

  async update(id: string, customer: Partial<Omit<Customer, 'user_id'>>) { // user_id should not be updatable this way
    await this.checkPermission('customers:update');
    return this.executeWithRetry(async () => {
      const { data: updatedCustomer, error } = await this.db
        .from('customers')
        .update(customer)
        .eq('id', id)
        .select()
        .single();
      
      if (error) this.handleError(error, 'فشل في تحديث بيانات العميل');
      return updatedCustomer;
    }, 'Failed to update customer');
  }

  async delete(id: string) {
    await this.checkPermission('customers:delete');
    return this.executeWithRetry(async () => {
      const { error } = await this.db
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) this.handleError(error, 'فشل في حذف العميل');
      return true; // Return true on successful deletion
    }, 'Failed to delete customer');
  }
}

export const customerService = new CustomerService();
