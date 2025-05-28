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
  reorder_level?: number; // New field
  preferred_stock_level?: number; // New field
  created_at: string;
  updated_at?: string;
  user_id: string;
};

export type StorageLocation = {
  id: string; // UUID
  name: string;
  description?: string;
  is_default: boolean;
  created_at: string;
  updated_at?: string;
};

export type SerialNumberStatus = 'in_stock' | 'sold' | 'transferred_out' | 'defective' | 'returned' | 'consumed';

export type SerialNumber = {
  id: number; // BIGSERIAL
  product_id: number; // BIGINT (references products.id)
  serial_number: string;
  status: SerialNumberStatus;
  location_id?: string | null; // UUID (references storage_locations.id)
  // Optional: For convenience when joining, not a direct DB column usually populated by default unless explicitly selected.
  storage_location?: Pick<StorageLocation, 'id' | 'name'> | null; 
  // purchase_item_id?: number; 
  invoice_item_id?: number;  
  notes?: string;
  created_at: string;
  updated_at?: string;
};

export type ProductStockLevel = {
  product_id: number; // BIGINT (references products.id)
  location_id: string; // UUID (references storage_locations.id)
  quantity: number;
  reorder_level?: number; // New field
  preferred_stock_level?: number; // New field
  updated_at: string;
  // Optional: For convenience when joining
  storage_location?: Pick<StorageLocation, 'id' | 'name'> | null;
  product?: Pick<Product, 'id' | 'name' | 'sku'> | null;
};

export type InventoryAdjustmentType = 
  | 'initial_stock'
  | 'cycle_count'
  | 'physical_count'
  | 'damage'
  | 'theft'
  | 'correction_increase'
  | 'correction_decrease'
  | 'purchase_receipt' // For non-serial items received
  | 'sale_dispatch'    // For non-serial items dispatched
  | 'stock_transfer_out'
  | 'stock_transfer_in'
  | 'other';

export type InventoryAdjustment = {
  id: string; // UUID
  location_id: string; // UUID of storage_locations
  product_id: number;  // BIGINT of products
  counted_quantity: number;
  expected_quantity: number;
  variance: number; // Computed: counted_quantity - expected_quantity
  adjustment_type: InventoryAdjustmentType | string; // Allow string for flexibility if DB uses TEXT
  notes?: string | null;
  user_id?: string | null; // UUID of auth.users (who initiated/counted)
  counted_at: string; // TIMESTAMPTZ
  is_processed: boolean;
  processed_at?: string | null; // TIMESTAMPTZ
  processed_by_user_id?: string | null; // UUID of auth.users
  created_at: string;
  updated_at?: string;

  // Optional: For convenience when joining data for display
  storage_location?: Pick<StorageLocation, 'id' | 'name'> | null;
  product?: Pick<Product, 'id' | 'name' | 'sku'> | null;
  user?: Pick<UserProfile, 'id' | 'username' | 'email'> | null; // User who counted/initiated
  processed_by_user?: Pick<UserProfile, 'id' | 'username' | 'email'> | null; // User who processed
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

// Updated Supplier type to match new schema (UUID for id)
export type Supplier = {
  id: string; // UUID
  name: string;
  contact_person?: string | null;
  email?: string | null; // Should be unique as per DB schema
  phone?: string | null;
  address?: string | null;
  // tax_number and balance might not be in the new suppliers table directly,
  // but could be derived or part of another related table (e.g., supplier_financials).
  // For now, keeping them optional if they are not part of the core supplier table.
  tax_number?: string | null; 
  balance?: number; // This is usually a calculated field, not stored directly.
  created_at: string;
  updated_at?: string;
  // user_id: string; // Removed as per new schema assumption (can be added if needed)
};

export type PurchaseOrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'partially_received'
  | 'fully_received'
  | 'cancelled';

export type PurchaseOrder = {
  id: string; // UUID
  po_number: string;
  supplier_id: string; // UUID, references suppliers.id
  order_date: string; // Date string (e.g., "YYYY-MM-DD")
  expected_delivery_date?: string | null; // Date string
  status: PurchaseOrderStatus | string; // Allow string for flexibility if DB ENUM is not strictly mapped
  notes?: string | null;
  shipping_address?: string | null;
  total_amount?: number | null; // NUMERIC
  created_by_user_id?: string | null; // UUID, references auth.users.id
  created_at: string; // TIMESTAMPTZ string
  updated_at?: string; // TIMESTAMPTZ string

  // Optional joined data for convenience
  supplier?: Pick<Supplier, 'id' | 'name'> | null;
  created_by_user?: Pick<UserProfile, 'id' | 'username' | 'email'> | null;
  items?: PurchaseOrderItem[]; // Populated when fetching full PO details
};

export type PurchaseOrderItem = {
  id: string; // UUID
  purchase_order_id: string; // UUID, references purchase_orders.id
  product_id: number; // BIGINT, references products.id
  description?: string | null; // Product name by default, or custom
  quantity: number;
  unit_price: number; // NUMERIC
  total_price: number; // NUMERIC, computed: quantity * unit_price
  received_quantity: number;

  // Optional joined data
  product?: Pick<Product, 'id' | 'name' | 'sku' | 'is_serial_tracked'> | null;
  
  // For UI interaction, especially when receiving goods
  // This field is client-side, used to temporarily store serials entered by user for this item during receipt.
  // It's then processed by the backend (e.g., purchaseOrderService.receiveGoods).
  serial_numbers_to_receive?: string[]; 
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
