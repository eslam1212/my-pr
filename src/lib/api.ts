import { supabase } from './supabase';
import { Transaction, Budget, Category, Report, Account, Customer } from '../types/database.types';

// Helper function to set auth headers from stored token
function prepareAuthHeaders(): Headers {
  const headers = new Headers();
  const storedToken = localStorage.getItem('supabase_access_token');
  if (storedToken) {
    headers.append('Authorization', `Bearer ${storedToken}`);
  }
  return headers;
}

// Authentication helper function to ensure valid session
async function ensureAuthenticated() {
  try {
    // Check if we've just refreshed the token recently
    const lastRefreshTime = parseInt(localStorage.getItem('last_token_refresh_time') || '0', 10);
    const now = Date.now();

    // If last refresh was less than 30 seconds ago, don't try again
    const tooRecentRefresh = now - lastRefreshTime < 30000;

    // First check for existing session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    // No session found or error, attempt refresh if not too recent
    if ((sessionError || !sessionData.session) && !tooRecentRefresh) {
      console.warn("No active session or session error. Attempting refresh...");
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

      // If refresh fails, authentication failed
      if (refreshError || !refreshData.session) {
        console.error("Auth refresh failed:", refreshError);
        throw new Error("Authentication required. Please sign in again.");
      }

      console.log("Session refreshed successfully");

      // Set token for API requests
      if (refreshData.session.access_token) {
        localStorage.setItem('supabase_access_token', refreshData.session.access_token);
        localStorage.setItem('last_token_refresh_time', now.toString());
      }

      return refreshData.session.user.id;
    } else if (!sessionData.session) {
      // No session and already tried refreshing recently
      throw new Error("Authentication required. Please sign in again.");
    }

    // Check if token will expire soon (less than 5 minutes) and refresh not too recent
    const expiresAt = sessionData.session.expires_at || 0;
    const nowSeconds = Math.floor(now / 1000);
    const timeLeft = expiresAt - nowSeconds;

    if (timeLeft < 300 && !tooRecentRefresh) {
      console.log("Session expiring soon. Refreshing token...");
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError || !refreshData.session) {
        console.error("Auth refresh failed:", refreshError);
        throw new Error("Authentication required. Please sign in again.");
      }

      console.log("Session refreshed successfully");

      // Set token for API requests
      if (refreshData.session.access_token) {
        localStorage.setItem('supabase_access_token', refreshData.session.access_token);
        localStorage.setItem('last_token_refresh_time', now.toString());
      }

      return refreshData.session.user.id;
    }

    return sessionData.session.user.id;
  } catch (error) {
    console.error("Authentication error:", error);
    throw new Error("Authentication required. Please sign in again.");
  }
}

// Transactions
export async function getTransactions() {
  try {
    // Ensure authentication
    await ensureAuthenticated();

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      if (error.code === '42P01') { // Table does not exist error
        console.warn('Transactions table does not exist yet');
        return [];
      } else if (error.code === '42501') { // Permission denied error
        console.warn('Permission denied for table transactions. Check RLS policies.');
        return [];
      }
      throw error;
    }
    // Map database column names to application types if needed
    const mappedData = data?.map(item => ({
      ...item,
      type: item.type_transaction
    }));
    return mappedData as Transaction[];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

export async function createTransaction(transaction: Omit<Transaction, 'id' | 'created_at'>) {
  try {
    // Map application types to database column names if needed
    const dbTransaction: any = {
      ...transaction,
      type_transaction: transaction.type,
    };
    // Remove the original type field using a type-safe approach
    if ('type' in dbTransaction) {
      delete dbTransaction.type;
    }

    const userId = await ensureAuthenticated();

    const transactionWithUser = {
      ...dbTransaction,
      user_id: userId
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionWithUser)
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') { // Table does not exist error
        console.warn('Transactions table does not exist yet');
        return {} as Transaction;
      }
      throw error;
    }
    // Map back to application type
    return {
      ...data,
      type: data.type_transaction
    } as Transaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

export async function updateTransaction(id: number, transaction: Partial<Transaction>) {
  try {
    await ensureAuthenticated();

    // Map application types to database column names if needed
    const dbTransaction: any = { ...transaction };
    if (transaction.type) {
      dbTransaction.type_transaction = transaction.type;
      if ('type' in dbTransaction) {
        delete dbTransaction.type;
      }
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(dbTransaction)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') { // Table does not exist error
        console.warn('Transactions table does not exist yet');
        return {} as Transaction;
      }
      throw error;
    }
    // Map back to application type
    return {
      ...data,
      type: data.type_transaction
    } as Transaction;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
}

export async function deleteTransaction(id: number) {
  try {
    await ensureAuthenticated();

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '42P01') { // Table does not exist error
        console.warn('Transactions table does not exist yet');
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
}

// Categories
export async function getCategories() {
  try {
    // Ensure authentication
    await ensureAuthenticated();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      if (error.code === '42P01') { // Table does not exist error
        console.warn('Categories table does not exist yet');
        return [];
      } else if (error.code === '42501') { // Permission denied error
        console.warn('Permission denied for table categories. Check RLS policies.');
        return [];
      }
      throw error;
    }
    // Map database column names to application types if needed
    const mappedData = data?.map(item => ({
      ...item,
      type: item.type_category
    }));
    return mappedData as Category[];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

export async function createCategory(category: Omit<Category, 'id' | 'created_at'>) {
  try {
    // Map application types to database column names if needed
    const dbCategory: any = {
      ...category,
      type_category: category.type
    };
    // Remove the original type field using a type-safe approach
    if ('type' in dbCategory) {
      delete dbCategory.type;
    }

    const userId = await ensureAuthenticated();

    const categoryWithUser = {
      ...dbCategory,
      user_id: userId // Assuming your column is named user_id
    };

    const { data, error } = await supabase
      .from('categories')
      .insert(categoryWithUser)
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') { // Table does not exist error
        console.warn('Categories table does not exist yet');
        return {} as Category;
      }
      throw error;
    }
    // Map back to application type
    return {
      ...data,
      type: data.type_category
    } as Category;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

// Budgets
export async function getBudgets() {
  try {
    // Ensure authentication
    await ensureAuthenticated();

    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      if (error.code === '42P01') { // Table does not exist error
        console.warn('Budgets table does not exist yet');
        return [];
      } else if (error.code === '42501') { // Permission denied error
        console.warn('Permission denied for table budgets. Check RLS policies.');
        return [];
      }
      throw error;
    }
    return data as Budget[];
  } catch (error) {
    console.error('Error fetching budgets:', error);
    throw error;
  }
}

export async function createBudget(budget: Omit<Budget, 'id' | 'created_at'>) {
  try {
    const userId = await ensureAuthenticated();

    const budgetWithUser = {
      ...budget,
      user_id: userId
    };

    const { data, error } = await supabase
      .from('budgets')
      .insert(budgetWithUser)
      .select()
      .single();

    if (error) throw error;
    return data as Budget;
  } catch (error) {
    console.error('Error creating budget:', error);
    throw error;
  }
}

export async function updateBudget(id: number, budget: Partial<Budget>) {
  try {
    // Ensure authentication
    await ensureAuthenticated();

    const { data, error } = await supabase
      .from('budgets')
      .update(budget)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Budget;
  } catch (error) {
    console.error('Error updating budget:', error);
    throw error;
  }
}

export async function deleteBudget(id: number) {
  try {
    // Ensure authentication
    await ensureAuthenticated();

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting budget:', error);
    throw error;
  }
}

// Reports
export async function getReports() {
  try {
    // Ensure authentication
    await ensureAuthenticated();

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Report[];
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
}

export async function createReport(report: Omit<Report, 'id' | 'created_at'>) {
  try {
    const userId = await ensureAuthenticated();

    const reportWithUser = {
      ...report,
      user_id: userId
    };

    const { data, error } = await supabase
      .from('reports')
      .insert(reportWithUser)
      .select()
      .single();

    if (error) throw error;
    return data as Report;
  } catch (error) {
    console.error('Error creating report:', error);
    throw error;
  }
}

// Accounts
export async function getAccounts() {
  try {
    // Ensure authentication
    await ensureAuthenticated();

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('name');

    if (error) {
      if (error.code === '42P01') { // Table does not exist error
        console.warn('Accounts table does not exist yet');
        return [];
      }
      throw error;
    }
    // Map database column names to application types if needed
    const mappedData = data?.map(item => ({
      ...item,
      type: item.account_type
    }));
    return mappedData as Account[];
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }
}

export async function createAccount(account: Omit<Account, 'id' | 'created_at'>) {
  try {
    // Map application types to database column names if needed
    const dbAccount: any = {
      ...account,
      account_type: account.type
    };
    // Remove the original type field using a type-safe approach
    if ('type' in dbAccount) {
      delete dbAccount.type;
    }

    const userId = await ensureAuthenticated();

    const accountWithUser = {
      ...dbAccount,
      user_id: userId
    };

    const { data, error } = await supabase
      .from('accounts')
      .insert(accountWithUser)
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') { // Table does not exist error
        console.warn('Accounts table does not exist yet');
        return {} as Account;
      }
      throw error;
    }
    // Map back to application type
    return {
      ...data,
      type: data.account_type
    } as Account;
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
}

export async function updateAccount(id: number, account: Partial<Account>) {
  try {
    await ensureAuthenticated();

    // Map application types to database column names if needed
    const dbAccount: any = { ...account };
    if (account.type) {
      dbAccount.account_type = account.type;
      if ('type' in dbAccount) {
        delete dbAccount.type;
      }
    }

    const { data, error } = await supabase
      .from('accounts')
      .update(dbAccount)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') { // Table does not exist error
        console.warn('Accounts table does not exist yet');
        return {} as Account;
      }
      throw error;
    }
    // Map back to application type
    return {
      ...data,
      type: data.account_type
    } as Account;
  } catch (error) {
    console.error('Error updating account:', error);
    throw error;
  }
}

// Dashboard Statistics
export async function getDashboardStats() {
  try {
    await ensureAuthenticated();

    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .limit(5);

    if (transactionsError) throw transactionsError;

    const { data: totalIncome } = await supabase
      .from('transactions')
      .select('amount')
      .eq('type', 'income')
      .gte('date', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString());

    const { data: totalExpenses } = await supabase
      .from('transactions')
      .select('amount')
      .eq('type', 'expense')
      .gte('date', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString());

    return {
      recentTransactions: transactions as Transaction[],
      monthlyIncome: totalIncome?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
      monthlyExpenses: totalExpenses?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

// User Settings
export async function saveUserSettings(userId: string, settings: any) {
  try {
    await ensureAuthenticated();

    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        settings: settings,
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      if (error.code === '42P01') { // Table does not exist error
        console.warn('User settings table does not exist yet');
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error saving user settings:', error);
    return null;
  }
}

export async function getUserSettings(userId: string) {
  try {
    await ensureAuthenticated();

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // PGRST116 is "no rows returned" error
      if (error.code === 'PGRST116' || error.code === '42P01') {
        console.warn('User settings not found or table does not exist');
        return null;
      } else if (error.code === '42501') { // Permission denied error
        console.warn('Permission denied for table user_settings. Check RLS policies.');
        return null;
      }
      throw error;
    }
    return data?.settings || null;
  } catch (error) {
    console.error('Error getting user settings:', error);
    return null;
  }
}

// Customer functions
export async function getCustomers() {
  try {
    await ensureAuthenticated();

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') { // Table does not exist error
        console.warn('Customers table does not exist yet');
        return [];
      } else if (error.code === '42501') { // Permission denied error
        console.warn('Permission denied for table customers. Check RLS policies.');
        return [];
      }
      throw error;
    }
    return data as Customer[];
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
}

export async function createCustomer(customer: Omit<Customer, 'id' | 'created_at'>) {
  try {
    const userId = await ensureAuthenticated();

    const customerWithUser = {
      ...customer,
      user_id: userId
    };

    const { data, error } = await supabase
      .from('customers')
      .insert(customerWithUser)
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') { // Table does not exist error
        console.warn('Customers table does not exist yet');
        return {} as Customer;
      }
      throw error;
    }
    return data as Customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

export async function updateCustomer(id: number, customer: Partial<Customer>) {
  try {
    await ensureAuthenticated();

    const { data, error } = await supabase
      .from('customers')
      .update(customer)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') {
        console.warn('Customers table does not exist yet');
        return {} as Customer;
      }
      throw error;
    }
    return data as Customer;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
}

export async function deleteCustomer(id: number) {
  try {
    await ensureAuthenticated();

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '42P01') {
        console.warn('Customers table does not exist yet');
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
}
