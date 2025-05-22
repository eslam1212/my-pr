// Update the Product interface
export type ProductUnit = 'piece' | 'kilogram' | 'box' | 'ton' | 'sack';

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  quantity: number;
  minQuantity: number;
  min_quantity?: number;
  unit: ProductUnit;
  description?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  tax_number?: string | null;
  balance: number;
  created_at?: string;
  updated_at?: string;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  tax_number?: string | null;
  balance: number;
  created_at?: string;
  updated_at?: string;
}

export type InvoiceStatus = 'draft' | 'confirmed' | 'paid' | 'cancelled' | 'pending';
export type InvoiceType = 'sale' | 'purchase';

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  product?: Product;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  created_at?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  type: InvoiceType;
  customer_id?: string | null;
  supplier_id?: string | null;
  customer?: Customer;
  supplier?: Supplier;
  date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  status: InvoiceStatus;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  items?: InvoiceItem[];
}
