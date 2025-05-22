export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          category_id: string | null
          name: string
          sku: string
          description: string | null
          price: number
          cost: number
          quantity: number
          min_quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          name: string
          sku: string
          description?: string | null
          price: number
          cost: number
          quantity: number
          min_quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          name?: string
          sku?: string
          description?: string | null
          price?: number
          cost?: number
          quantity?: number
          min_quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          tax_number: string | null
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          tax_number?: string | null
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          tax_number?: string | null
          balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      suppliers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          tax_number: string | null
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          tax_number?: string | null
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          tax_number?: string | null
          balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          type: string
          customer_id: string | null
          supplier_id: string | null
          date: string
          subtotal: number
          tax_amount: number
          discount_amount: number
          total_amount: number
          paid_amount: number
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_number: string
          type: string
          customer_id?: string | null
          supplier_id?: string | null
          date?: string
          subtotal: number
          tax_amount: number
          discount_amount: number
          total_amount: number
          paid_amount: number
          status: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_number?: string
          type?: string
          customer_id?: string | null
          supplier_id?: string | null
          date?: string
          subtotal?: number
          tax_amount?: number
          discount_amount?: number
          total_amount?: number
          paid_amount?: number
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          product_id: string
          quantity: number
          unit_price: number
          discount_amount: number
          tax_amount: number
          total_amount: number
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          product_id: string
          quantity: number
          unit_price: number
          discount_amount: number
          tax_amount: number
          total_amount: number
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          discount_amount?: number
          tax_amount?: number
          total_amount?: number
          created_at?: string
        }
      }
      inventory_transactions: {
        Row: {
          id: string
          product_id: string
          invoice_item_id: string | null
          type: string
          quantity: number
          balance_after: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          invoice_item_id?: string | null
          type: string
          quantity: number
          balance_after: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          invoice_item_id?: string | null
          type?: string
          quantity?: number
          balance_after?: number
          notes?: string | null
          created_at?: string
        }
      }
      payment_transactions: {
        Row: {
          id: string
          invoice_id: string
          amount: number
          payment_method: string
          reference_number: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          amount: number
          payment_method: string
          reference_number?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          amount?: number
          payment_method?: string
          reference_number?: string | null
          notes?: string | null
          created_at?: string
        }
      }
    }
  }
}
