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
  quantity: number;
  min_quantity: number;
  unit?: string;
  category_id?: number;
  created_at: string;
  updated_at?: string;
  user_id: string;
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
};
