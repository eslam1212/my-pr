import { BaseService } from './base.service';
import { Customer } from '../types';

class CustomerService extends BaseService {
  async getAll() {
    try {
      // First check if we have an active session
      const { data } = await this.db.auth.getSession();
      if (!data.session) {
        console.warn("No active session found. Attempting to refresh...");
        
        // Try to refresh the session
        const { data: refreshData } = await this.db.auth.refreshSession();
        if (!refreshData.session) {
          throw new Error("Authentication required. Please log in.");
        }
      }
      
      const { data: userData, error: userError } = await this.db.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("User not authenticated to fetch customers.");
      }
      
      const { data: customers, error } = await this.db
        .from('customers')
        .select('*');
      
      if (error) {
        console.error("Error fetching customers:", error);
        throw error;
      }
      
      return customers || [];
    } catch (error) {
      return this.handleError(error, 'فشل في تحميل العملاء');
    }
  }

  async getById(id: string) {
    try {
      // Check for active session
      const { data } = await this.db.auth.getSession();
      if (!data.session) {
        throw new Error("Authentication required. Please log in.");
      }
      
      const { data: userData, error: userError } = await this.db.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("User not authenticated to fetch customer details.");
      }
      
      const { data: customer, error } = await this.db
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return customer;
    } catch (error) {
      return this.handleError(error, 'فشل في تحميل بيانات العميل');
    }
  }

  async create(customer: Omit<Customer, 'id'>) {
    try {
      // Check for active session
      const { data } = await this.db.auth.getSession();
      if (!data.session) {
        throw new Error("Authentication required. Please log in.");
      }
      
      const { data: userData, error: userError } = await this.db.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("User not authenticated to create customer.");
      }
      
      const userId = userData.user.id;
      
      const customerWithUser = {
        ...customer,
        user_id: userId
      };
      
      const { data: newCustomer, error } = await this.db
        .from('customers')
        .insert(customerWithUser)
        .select()
        .single();
      
      if (error) throw error;
      return newCustomer;
    } catch (error) {
      return this.handleError(error, 'فشل في إضافة العميل');
    }
  }

  async update(id: string, customer: Partial<Customer>) {
    try {
      // Check for active session
      const { data } = await this.db.auth.getSession();
      if (!data.session) {
        throw new Error("Authentication required. Please log in.");
      }
      
      const { data: userData, error: userError } = await this.db.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("User not authenticated to update customer.");
      }
      
      const { data: updatedCustomer, error } = await this.db
        .from('customers')
        .update(customer)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedCustomer;
    } catch (error) {
      return this.handleError(error, 'فشل في تحديث بيانات العميل');
    }
  }

  async delete(id: string) {
    try {
      // Check for active session
      const { data } = await this.db.auth.getSession();
      if (!data.session) {
        throw new Error("Authentication required. Please log in.");
      }
      
      const { data: userData, error: userError } = await this.db.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("User not authenticated to delete customer.");
      }
      
      const { error } = await this.db
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      return this.handleError(error, 'فشل في حذف العميل');
    }
  }
}

export const customerService = new CustomerService();
