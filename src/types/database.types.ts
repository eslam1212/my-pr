export type Transaction = {
  id: number;
  created_at: string;
  updated_at?: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  type_transaction?: 'income' | 'expense';
  category: string;
  reference?: string;
  status: 'pending' | 'completed' | 'cancelled';
  payment_method?: string;
  user_id: string;
};

export type Budget = {
  id: number;
  created_at: string;
  updated_at?: string;
  start_date: string;
  end_date: string;
  category: string;
  amount: number;
  spent: number;
  remaining: number;
  user_id: string;
};

export type Category = {
  id: number;
  name: string;
  type: 'income' | 'expense';
  type_category?: 'income' | 'expense';
  description?: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
};

export type Report = {
  id: number;
  created_at: string;
  updated_at?: string;
  title: string;
  description?: string;
  type: 'income' | 'expense' | 'budget';
  date_range: {
    start: string;
    end: string;
  };
  data: any;
  user_id: string;
};

export type Account = {
  id: number;
  created_at: string;
  updated_at?: string;
  name: string;
  type: 'cash' | 'bank' | 'credit';
  account_type?: 'cash' | 'bank' | 'credit';
  balance: number;
  currency: string;
  user_id: string;
};

export type Product = {
  id: number;
  name: string;
  sku: string;
  description?: string;
  price: number;
  cost: number;
  quantity: number; // For non-serial tracked, this is total quantity. For serial-tracked, this might be derived or represent available count.
  min_quantity: number;
  unit?: string;
  category_id?: number;
  barcode?: string; // New field
  is_serial_tracked?: boolean; // New field
  created_at: string;
  updated_at?: string;
  user_id: string;
};

export type SerialNumberStatus = 'in_stock' | 'sold' | 'transferred_out' | 'defective' | 'returned' | 'consumed';

export type SerialNumber = {
  id: number; // Changed from UUID to number (BIGSERIAL) to match migration
  product_id: number; // Changed from UUID to number
  serial_number: string;
  status: SerialNumberStatus;
  // purchase_item_id?: number; // Link to purchase
  invoice_item_id?: number;  // Link to sale - assuming invoice_items.id is number
  // current_location_id?: number; // Link to location
  notes?: string;
  created_at: string;
  updated_at?: string;
};

export type TransactionItemSerial = {
  id: number; // Changed from UUID to number
  invoice_item_id?: number; // Assuming invoice_items.id is number
  // purchase_order_item_id?: number;
  // stock_transfer_item_id?: number;
  // stock_adjustment_item_id?: number;
  serial_number_id: number; // Changed from UUID to number
  transaction_type: string; // e.g., 'sale', 'purchase_receipt', etc.
  created_at: string;
};

export type Customer = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_number?: string;
  balance: number;
  created_at: string;
  updated_at?: string;
  user_id: string;
};

export type Supplier = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_number?: string;
  balance: number;
  created_at: string;
  updated_at?: string;
  user_id: string;
};

export type Invoice = {
  id: number;
  invoice_number: string;
  invoice_type: 'sale' | 'purchase';
  customer_id?: number;
  supplier_id?: number;
  date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  status: 'draft' | 'confirmed' | 'paid' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
};

export type InvoiceItem = {
  id: number;
  invoice_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  created_at: string;
  updated_at?: string;
  // For client-side payload when creating/updating invoices with serial-tracked items
  serial_numbers_provided?: string[]; // Array of serial number strings
};

// Placeholder for Supabase Auth User / public.users profile
export type UserProfile = { // Renamed to UserProfile for clarity, matching public.users
  id: string; // Typically UUID from auth.users, primary key
  username?: string;
  email?: string;
  role?: string; // Existing role field, can be used for default/fallback
  
  // 2FA related fields
  is_two_factor_enabled?: boolean;
  // two_factor_secret is server-side only, not typically sent to client
  // two_factor_backup_codes are sent once upon generation, then server-side only

  created_at?: string;
  updated_at?: string;
  // any other fields from your public.users table
};

// This type might be used by auth hooks/contexts, representing the authenticated user object from Supabase Auth
export type AuthenticatedUser = {
    id: string; // UUID
    email?: string;
    // other auth-specific fields like app_metadata, user_metadata
    // We might augment this with is_two_factor_enabled from their profile for login flow decisions
    is_two_factor_enabled?: boolean; 
};


export type Permission = {
  id: number;
  name: string; // e.g., "product:create", "invoice:edit", "report:financial:view"
  description?: string;
  created_at: string;
  updated_at?: string;
};

export type UserGroup = {
  id: number;
  group_name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
};

// Junction table for UserGroup and Permission
export type GroupPermissionAssignment = {
  id: number;
  group_id: number; // FK to UserGroup.id
  permission_id: number; // FK to Permission.id
  created_at: string;
  updated_at?: string;
};

// Junction table for User and UserGroup
// Assuming a user can belong to only one group for now, user_id should be unique.
// If a user could belong to multiple groups, the unique constraint would be on (user_id, group_id).
export type UserGroupAssignment = {
  id: number;
  user_id: string; // FK to users.id
  group_id: number; // FK to UserGroup.id
  created_at: string;
  updated_at?: string;
};
