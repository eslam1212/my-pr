import { BaseService } from './base.service';
import { Product } from '../types';
import { AppError } from '../utils/error-handler';

export interface InventoryLocation {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface StockItem {
  id: string;
  product_id: string;
  location_id: string;
  quantity: number;
  unit: string;
  created_at?: string;
  updated_at?: string;
  product?: Product;
  location?: InventoryLocation;
}

export interface StockMovement {
  id: string;
  product_id: string;
  from_location_id?: string;
  to_location_id: string;
  quantity: number;
  movement_type: 'in' | 'out' | 'transfer';
  reference?: string;
  notes?: string;
  created_at?: string;
  product?: Product;
  from_location?: InventoryLocation;
  to_location?: InventoryLocation;
}

class InventoryService extends BaseService {
  // Get all inventory locations
  async getLocations(): Promise<InventoryLocation[]> {
    try {
      const { data, error } = await this.db
        .from('inventory_locations')
        .select('*')
        .order('name');
      
      if (error) {
        throw new AppError('فشل في تحميل مواقع المخزون', error.code, error.details);
      }
      
      return data || [];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('فشل في تحميل مواقع المخزون');
    }
  }

  // Create a new inventory location
  async createLocation(location: Omit<InventoryLocation, 'id' | 'created_at'>): Promise<InventoryLocation> {
    try {
      const { data, error } = await this.db
        .from('inventory_locations')
        .insert(location)
        .select()
        .single();
      
      if (error) {
        throw new AppError('فشل في إضافة موقع المخزون', error.code, error.details);
      }
      
      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('فشل في إضافة موقع المخزون');
    }
  }

  // Get all stock items with product and location details
  async getStock(): Promise<StockItem[]> {
    try {
      const { data, error } = await this.db
        .from('inventory_stock')
        .select(`
          *,
          product:products(*),
          location:inventory_locations(*)
        `);
      
      if (error) {
        throw new AppError('فشل في تحميل المخزون', error.code, error.details);
      }
      
      return data || [];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('فشل في تحميل المخزون');
    }
  }

  // Get stock for a specific product
  async getProductStock(productId: string): Promise<StockItem[]> {
    try {
      const { data, error } = await this.db
        .from('inventory_stock')
        .select(`
          *,
          product:products(*),
          location:inventory_locations(*)
        `)
        .eq('product_id', productId);
      
      if (error) {
        throw new AppError('فشل في تحميل مخزون المنتج', error.code, error.details);
      }
      
      return data || [];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('فشل في تحميل مخزون المنتج');
    }
  }

  // Update stock quantity
  async updateStock(stockId: string, quantity: number): Promise<StockItem> {
    try {
      const { data, error } = await this.db
        .from('inventory_stock')
        .update({ quantity, updated_at: new Date().toISOString() })
        .eq('id', stockId)
        .select()
        .single();
      
      if (error) {
        throw new AppError('فشل في تحديث المخزون', error.code, error.details);
      }
      
      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('فشل في تحديث المخزون');
    }
  }

  // Create a new stock item
  async createStock(stockItem: Omit<StockItem, 'id' | 'created_at' | 'updated_at' | 'product' | 'location'>): Promise<StockItem> {
    try {
      const { data, error } = await this.db
        .from('inventory_stock')
        .insert({
          ...stockItem,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw new AppError('فشل في إضافة المخزون', error.code, error.details);
      }
      
      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('فشل في إضافة المخزون');
    }
  }

  // Record a stock movement (in, out, or transfer)
  async recordMovement(movement: Omit<StockMovement, 'id' | 'created_at' | 'product' | 'from_location' | 'to_location'>): Promise<StockMovement> {
    try {
      // Start a transaction
      const { data, error } = await this.db
        .from('inventory_movements')
        .insert({
          ...movement,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        throw new AppError('فشل في تسجيل حركة المخزون', error.code, error.details);
      }
      
      // Update stock quantities based on movement type
      if (movement.movement_type === 'in') {
        // Check if stock exists for this product and location
        const { data: existingStock } = await this.db
          .from('inventory_stock')
          .select('*')
          .eq('product_id', movement.product_id)
          .eq('location_id', movement.to_location_id);
        
        if (existingStock && existingStock.length > 0) {
          // Update existing stock
          await this.db
            .from('inventory_stock')
            .update({ 
              quantity: existingStock[0].quantity + movement.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingStock[0].id);
        } else {
          // Create new stock entry
          await this.db
            .from('inventory_stock')
            .insert({
              product_id: movement.product_id,
              location_id: movement.to_location_id,
              quantity: movement.quantity,
              unit: 'piece', // Default unit, should be provided in movement
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
      } else if (movement.movement_type === 'out') {
        // Check if stock exists and has enough quantity
        const { data: existingStock } = await this.db
          .from('inventory_stock')
          .select('*')
          .eq('product_id', movement.product_id)
          .eq('location_id', movement.from_location_id);
        
        if (!existingStock || existingStock.length === 0) {
          throw new AppError('لا يوجد مخزون كافي للمنتج في هذا الموقع');
        }
        
        if (existingStock[0].quantity < movement.quantity) {
          throw new AppError('الكمية المطلوبة أكبر من المخزون المتاح');
        }
        
        // Update stock quantity
        await this.db
          .from('inventory_stock')
          .update({ 
            quantity: existingStock[0].quantity - movement.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingStock[0].id);
      } else if (movement.movement_type === 'transfer') {
        if (!movement.from_location_id || !movement.to_location_id) {
          throw new AppError('يجب تحديد موقع المصدر والوجهة للتحويل');
        }
        
        // Check source stock
        const { data: sourceStock } = await this.db
          .from('inventory_stock')
          .select('*')
          .eq('product_id', movement.product_id)
          .eq('location_id', movement.from_location_id);
        
        if (!sourceStock || sourceStock.length === 0 || sourceStock[0].quantity < movement.quantity) {
          throw new AppError('لا يوجد مخزون كافي في موقع المصدر');
        }
        
        // Reduce from source
        await this.db
          .from('inventory_stock')
          .update({ 
            quantity: sourceStock[0].quantity - movement.quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', sourceStock[0].id);
        
        // Add to destination
        const { data: destStock } = await this.db
          .from('inventory_stock')
          .select('*')
          .eq('product_id', movement.product_id)
          .eq('location_id', movement.to_location_id);
        
        if (destStock && destStock.length > 0) {
          // Update existing destination stock
          await this.db
            .from('inventory_stock')
            .update({ 
              quantity: destStock[0].quantity + movement.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', destStock[0].id);
        } else {
          // Create new destination stock
          await this.db
            .from('inventory_stock')
            .insert({
              product_id: movement.product_id,
              location_id: movement.to_location_id,
              quantity: movement.quantity,
              unit: sourceStock[0].unit, // Use the same unit as source
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
      }
      
      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('فشل في تسجيل حركة المخزون');
    }
  }

  // Get inventory statistics
  async getInventoryStats() {
    try {
      // Get total products
      const { count: totalProducts, error: productsError } = await this.db
        .from('products')
        .select('*', { count: 'exact', head: true });
      
      if (productsError) {
        throw new AppError('فشل في تحميل إحصائيات المنتجات', productsError.code, productsError.details);
      }
      
      // Get products in stock
      const { data: stockData, error: stockError } = await this.db
        .from('inventory_stock')
        .select('product_id')
        .gt('quantity', 0);
      
      if (stockError) {
        throw new AppError('فشل في تحميل إحصائيات المخزون', stockError.code, stockError.details);
      }
      
      // Get unique products that have stock
      const productsInStock = new Set(stockData?.map(item => item.product_id)).size;
      
      // Get low stock products
      const { data: lowStockData, error: lowStockError } = await this.db
        .from('products')
        .select(`
          id,
          min_quantity,
          inventory_stock!inner(
            quantity,
            product_id
          )
        `)
        .filter('inventory_stock.quantity', 'lte', this.db.raw('min_quantity'));
      
      if (lowStockError) {
        throw new AppError('فشل في تحميل إحصائيات المخزون المنخفض', lowStockError.code, lowStockError.details);
      }
      
      return {
        totalProducts: totalProducts || 0,
        inStockProducts: productsInStock || 0,
        lowStockProducts: lowStockData?.length || 0,
        alerts: lowStockData?.length || 0
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('فشل في تحميل إحصائيات المخزون');
    }
  }
}

export const inventoryService = new InventoryService(); 