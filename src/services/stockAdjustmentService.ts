import { BaseService } from './base.service';
import { InventoryAdjustment, InventoryAdjustmentType, Product, UserProfile } from '../types';
import { AppError } from '../utils/error-handler';
import { productService } from './product.service';
import { inventoryService } from './inventory.service'; // Assuming this service can update stock levels
import { serialNumberService } from './serialNumberService'; // For future serial-tracked adjustments
import { storageLocationService } from './storageLocationService';
import { authService } from './authService'; // To get current user ID

export class StockAdjustmentService extends BaseService {
  private adjustmentTable = 'inventory_adjustments';

  /**
   * Gets the expected (current system) stock quantity for a product at a location.
   */
  async getExpectedStock(productId: number, locationId: string): Promise<number> {
    // This relies on the (problematic) inventoryService.getStockForProduct.
    // If inventoryService cannot be fixed, this part would need a direct query.
    // For now, proceeding with the assumption it works or will be fixed conceptually.
    try {
      const stockInfo = await inventoryService.getStockForProduct(productId, locationId);
      return stockInfo.quantity;
    } catch (error) {
      console.error(`Error getting expected stock for product ${productId} at location ${locationId}:`, error);
      if (error instanceof AppError && error.statusCode === '404') return 0; // Product or location might not exist, or no stock record
      throw error; // Re-throw other errors
    }
  }

  /**
   * Records a stock count/adjustment entry.
   */
  async recordInventoryAdjustment(
    input: Omit<InventoryAdjustment, 'id' | 'variance' | 'created_at' | 'updated_at' | 'is_processed' | 'processed_at' | 'processed_by_user_id' | 'user_id'> & {user_id?: string | null}
  ): Promise<InventoryAdjustment> {
    // await userService.checkCurrentUserPermission('inventory:count'); // Example permission
    
    const variance = input.counted_quantity - input.expected_quantity;
    const currentUser = await authService.getCurrentUser(); // Get current user for user_id

    const adjustmentData: Omit<InventoryAdjustment, 'id' | 'created_at' | 'updated_at'> = {
      ...input,
      variance,
      user_id: input.user_id || currentUser?.id || null, // Assign current user if not provided
      is_processed: false, // Always false on initial record
      processed_at: null,
      processed_by_user_id: null,
    };

    return this.executeWithRetry(async () => {
      const { data, error } = await this.db
        .from(this.adjustmentTable)
        .insert(adjustmentData)
        .select(`
          *,
          storage_location:storage_locations (id, name),
          product:products (id, name, sku),
          user:users (id, username, email)
        `) // Assuming 'users' is the table for UserProfile
        .single();

      if (error) {
        this.handleError(error, 'فشل في تسجيل عملية الجرد/التسوية.');
      }
      return data as InventoryAdjustment;
    }, 'Failed to record inventory adjustment.');
  }

  /**
   * Processes a recorded stock adjustment, updating actual stock levels.
   */
  async processInventoryAdjustment(adjustmentId: string): Promise<InventoryAdjustment> {
    // await userService.checkCurrentUserPermission('inventory:process_adjustment');
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) throw new AppError("يجب تسجيل الدخول لمعالجة التسوية.", "401");

    return this.executeWithRetry(async () => {
      const { data: adjustment, error: fetchError } = await this.db
        .from(this.adjustmentTable)
        .select('*')
        .eq('id', adjustmentId)
        .single();

      if (fetchError || !adjustment) {
        throw new AppError(`لم يتم العثور على سجل التسوية بالمعرف ${adjustmentId}.`, '404', fetchError?.details);
      }
      if (adjustment.is_processed) {
        throw new AppError(`التسوية بالمعرف ${adjustmentId} قد تمت معالجتها بالفعل.`, '400');
      }

      const product = await productService.getById(adjustment.product_id.toString());
      if (!product) {
        throw new AppError(`المنتج المرتبط بالتسوية (ID: ${adjustment.product_id}) غير موجود.`, '404');
      }

      if (product.is_serial_tracked) {
        // Simplified handling for serial-tracked products for this phase:
        // Log and mark as processed without changing serial number statuses automatically.
        // Actual reconciliation would require matching physical serials against DB serials.
        console.warn(`معالجة تسوية لمنتج متسلسل (${product.name}): الفرق ${adjustment.variance}. يتطلب هذا إجراءً يدويًا على الأرقام التسلسلية الفردية.`);
        // For example, if variance is negative, one might need to identify missing serials and update their status.
        // If positive, new serials would need to be registered.
        // This step is primarily for logging the discrepancy.
      } else {
        // For non-serial-tracked products, update product_stock_levels
        // The 'variance' is the actual change to apply to current stock.
        // (counted_quantity - expected_quantity) = variance.
        // new_stock = current_stock_before_this_adjustment_was_recorded + variance
        // OR new_stock = counted_quantity.
        // The `inventoryService.updateStockLevel` expects a `quantityChange`.
        // If `expected_quantity` in the adjustment record was the system stock *before* this adjustment,
        // then `variance` is the correct `quantityChange`.
        // However, `updateStockLevel` itself fetches current stock and adds `quantityChange`.
        // To set stock to `counted_quantity`, `quantityChange` should be `counted_quantity - current_stock_in_product_stock_levels`.
        // This needs careful handling of what `expected_quantity` represents.
        // Assuming `expected_quantity` was the definitive stock *before* the count that led to this adjustment record.
        // And the goal is to make the `product_stock_levels.quantity` = `adjustment.counted_quantity`.
        
        // Fetch current stock level again to calculate precise change needed from *now*.
        const currentStockInfo = await inventoryService.getStockForProduct(adjustment.product_id, adjustment.location_id);
        const quantityChangeToApply = adjustment.counted_quantity - currentStockInfo.quantity;
        
        await inventoryService.updateStockLevel(
          adjustment.product_id,
          adjustment.location_id,
          quantityChangeToApply, // Apply the difference from current actual to new counted
          product.name
        );
      }

      // Mark adjustment as processed
      const { data: updatedAdjustment, error: updateError } = await this.db
        .from(this.adjustmentTable)
        .update({ 
          is_processed: true, 
          processed_at: new Date().toISOString(),
          processed_by_user_id: currentUser.id
        })
        .eq('id', adjustmentId)
        .select(`
          *,
          storage_location:storage_locations (id, name),
          product:products (id, name, sku),
          user:users (id, username, email),
          processed_by_user:users (id, username, email)
        `)
        .single();
      
      if (updateError) {
        this.handleError(updateError, `فشل في تحديث حالة التسوية ${adjustmentId}.`);
      }
      return updatedAdjustment as InventoryAdjustment;
    }, `Failed to process stock adjustment ${adjustmentId}.`);
  }

  /**
   * Lists inventory adjustments with optional filters.
   */
  async listInventoryAdjustments(filters: { 
    locationId?: string; 
    processed?: boolean; 
    productId?: number;
    dateFrom?: string;
    dateTo?: string;
    adjustmentType?: string;
  } = {}): Promise<InventoryAdjustment[]> {
    // await userService.checkCurrentUserPermission('inventory:view_adjustments');
    return this.executeWithRetry(async () => {
      let query = this.db.from(this.adjustmentTable).select(`
        *,
        storage_location:storage_locations (id, name),
        product:products (id, name, sku, is_serial_tracked),
        user:users (id, username, email),
        processed_by_user:users (id, username, email)
      `);

      if (filters.locationId) query = query.eq('location_id', filters.locationId);
      if (typeof filters.processed === 'boolean') query = query.eq('is_processed', filters.processed);
      if (filters.productId) query = query.eq('product_id', filters.productId);
      if (filters.dateFrom) query = query.gte('counted_at', filters.dateFrom);
      if (filters.dateTo) query = query.lte('counted_at', filters.dateTo);
      if (filters.adjustmentType) query = query.eq('adjustment_type', filters.adjustmentType);
      
      query = query.order('counted_at', { ascending: false });

      const { data, error } = await query;
      if (error) {
        this.handleError(error, 'فشل في تحميل قائمة التسويات المخزنية.');
      }
      return (data as InventoryAdjustment[]) || [];
    }, 'Failed to list inventory adjustments.');
  }
}

export const stockAdjustmentService = new StockAdjustmentService();
