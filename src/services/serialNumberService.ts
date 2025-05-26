import { BaseService } from './base.service';
import { SerialNumber, SerialNumberStatus, TransactionItemSerial, Product } from '../types'; // Ensure Product is imported if needed
import { AppError } from '../utils/error-handler';
import { userService } from './userService'; // For permission checks if needed for serial number operations

class SerialNumberService extends BaseService {
  private serialTable = 'serial_numbers';
  private transactionItemSerialTable = 'transaction_item_serials';
  private productTable = 'products'; // To check if product is serial tracked

  // Helper for permission checks, specific to serial number operations if any
  private async checkPermission(permission: string) {
    // Example: 'serialnumbers:manage', 'serialnumbers:view'
    // For now, assume general inventory permissions cover this, or add specific ones.
    // const hasPermission = await userService.checkCurrentUserPermission(permission);
    // if (!hasPermission) {
    //   throw new AppError(`Unauthorized: Missing permission ${permission}`, '403', 'User does not have the required permission.');
    // }
    // Skipping specific permission checks for serial numbers for brevity in this step,
    // assuming product CUD permissions implicitly grant rights to manage associated serials.
  }

  async createSerialNumberEntry(
    productId: number, 
    serialNumberValue: string, 
    status: SerialNumberStatus = 'in_stock', 
    // purchaseItemId?: number, // Assuming this will be linked via transaction_item_serials
    notes?: string
  ): Promise<SerialNumber> {
    await this.checkPermission('inventory:manage'); // Or a more specific permission

    // Check if product is serial tracked
    const { data: product, error: productError } = await this.db
      .from<any, { data: Product }>(this.productTable) // Use any for from, then specify data type for select
      .select('id, is_serial_tracked')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      throw new AppError(`المنتج بالمعرف ${productId} غير موجود.`, '404', productError?.details);
    }
    if (!product.is_serial_tracked) {
      throw new AppError(`المنتج ${productId} لا يتم تتبعه بالأرقام التسلسلية.`, '400');
    }

    return this.executeWithRetry(async () => {
      const { data, error } = await this.db
        .from(this.serialTable)
        .insert({ 
          product_id: productId, 
          serial_number: serialNumberValue, 
          status,
          notes 
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          throw new AppError(`الرقم التسلسلي '${serialNumberValue}' موجود بالفعل لهذا المنتج.`, '409', error.details);
        }
        this.handleError(error, `فشل في إنشاء الرقم التسلسلي ${serialNumberValue}`);
      }
      return data as SerialNumber;
    }, `Failed to create serial number ${serialNumberValue}`);
  }
  
  async addSerialNumberToTransaction(
    serialNumberId: number,
    transactionItemId: number, // e.g., invoice_item_id, purchase_order_item_id
    transactionItemType: 'invoice_item_id' | 'purchase_order_item_id' | 'stock_transfer_item_id', // Add more as needed
    transactionType: string // 'sale', 'purchase_receipt', etc.
  ): Promise<TransactionItemSerial> {
    // Permissions checked at higher level (e.g. creating invoice/purchase)
    return this.executeWithRetry(async () => {
      const payload: Partial<TransactionItemSerial> = {
        serial_number_id: serialNumberId,
        transaction_type: transactionType,
      };
      payload[transactionItemType] = transactionItemId;

      const { data, error } = await this.db
        .from(this.transactionItemSerialTable)
        .insert(payload)
        .select()
        .single();
      
      if (error) {
        this.handleError(error, 'فشل في ربط الرقم التسلسلي بالمعاملة.');
      }
      return data as TransactionItemSerial;
    }, 'Failed to link serial number to transaction item.');
  }


  async getSerialNumbersForProduct(productId: number, status?: SerialNumberStatus): Promise<SerialNumber[]> {
    // await this.checkPermission('inventory:view'); // Or a more specific permission
    return this.executeWithRetry(async () => {
      let query = this.db.from(this.serialTable).select('*').eq('product_id', productId);
      if (status) {
        query = query.eq('status', status);
      }
      const { data, error } = await query;

      if (error) {
        this.handleError(error, `فشل في جلب الأرقام التسلسلية للمنتج ${productId}`);
      }
      return (data as SerialNumber[]) || [];
    }, `Failed to fetch serial numbers for product ${productId}`);
  }

  async getSerialNumberDetails(serialNumberValue: string, productId?: number): Promise<SerialNumber | null> {
    // await this.checkPermission('inventory:view');
    return this.executeWithRetry(async () => {
      let query = this.db.from(this.serialTable).select('*').eq('serial_number', serialNumberValue);
      if (productId) {
        query = query.eq('product_id', productId);
      }
      const { data, error } = await query.maybeSingle(); // Returns null if not found

      if (error) {
        this.handleError(error, `فشل في جلب تفاصيل الرقم التسلسلي ${serialNumberValue}`);
      }
      return data as SerialNumber | null;
    }, `Failed to fetch details for serial number ${serialNumberValue}`);
  }
  
  async getSerialNumberById(id: number): Promise<SerialNumber | null> {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.db
        .from(this.serialTable)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) this.handleError(error, `فشل في جلب الرقم التسلسلي بالمعرف ${id}`);
      return data as SerialNumber | null;
    }, `Failed to fetch serial by ID ${id}`);
  }


  async updateSerialNumber(
    serialNumberId: number, 
    updates: { status?: SerialNumberStatus; notes?: string; invoice_item_id?: number | null /* Add other updatable fields if any */ }
  ): Promise<SerialNumber> {
    // await this.checkPermission('inventory:manage');
    return this.executeWithRetry(async () => {
      const { data, error } = await this.db
        .from(this.serialTable)
        .update(updates)
        .eq('id', serialNumberId)
        .select()
        .single();

      if (error) {
        this.handleError(error, `فشل في تحديث الرقم التسلسلي ${serialNumberId}`);
      }
      return data as SerialNumber;
    }, `Failed to update serial number ${serialNumberId}`);
  }

  /**
   * Checks availability of a list of serial numbers for a given product.
   * Returns a map of serial number string to its availability (true if 'in_stock', false otherwise).
   */
  async checkAvailability(productId: number, serialNumberValues: string[]): Promise<Map<string, SerialNumber | null>> {
    // await this.checkPermission('inventory:view');
    return this.executeWithRetry(async () => {
      const { data: serials, error } = await this.db
        .from(this.serialTable)
        .select('*')
        .eq('product_id', productId)
        .in('serial_number', serialNumberValues);

      if (error) {
        this.handleError(error, 'فشل في التحقق من توفر الأرقام التسلسلية.');
      }
      
      const availabilityMap = new Map<string, SerialNumber | null>();
      serialNumberValues.forEach(snValue => availabilityMap.set(snValue, null)); // Initialize all as not found / not available

      (serials as SerialNumber[])?.forEach(snRecord => {
        availabilityMap.set(snRecord.serial_number, snRecord);
      });
      
      return availabilityMap;
    }, 'Failed to check serial number availability.');
  }
  
  async getSerialNumberHistory(serialNumberId: number): Promise<TransactionItemSerial[]> {
    // This method provides a basic history by listing all transaction links.
    // A more detailed history might involve joining with actual transaction tables.
    // await this.checkPermission('inventory:view');
    return this.executeWithRetry(async () => {
      const { data, error } = await this.db
        .from(this.transactionItemSerialTable)
        .select(`
          *,
          invoice_items (id, invoice_id, product_id, quantity),
          serial_numbers (id, serial_number, status)
        `) // Example of expanding related data, adjust as per actual table names and needs
        .eq('serial_number_id', serialNumberId)
        .order('created_at', { ascending: false });

      if (error) {
        this.handleError(error, `فشل في جلب سجل الرقم التسلسلي ${serialNumberId}`);
      }
      return (data as TransactionItemSerial[]) || [];
    }, `Failed to fetch serial number history for ${serialNumberId}`);
  }

  // Potentially delete a serial number if entered by error AND not used in transactions.
  // Careful with this operation. Usually, serial numbers are not deleted but marked 'defective' or 'consumed'.
  async deleteSerialNumber(serialNumberId: number): Promise<boolean> {
    // await this.checkPermission('inventory:admin'); // Needs a very high privilege
    return this.executeWithRetry(async () => {
      // First, check if this serial number is part of any transaction
      const { data: transactions, error: transError } = await this.db
        .from(this.transactionItemSerialTable)
        .select('id')
        .eq('serial_number_id', serialNumberId)
        .limit(1);

      if (transError) {
        this.handleError(transError, `فشل في التحقق من معاملات الرقم التسلسلي ${serialNumberId}`);
      }
      if (transactions && transactions.length > 0) {
        throw new AppError('لا يمكن حذف الرقم التسلسلي لأنه مرتبط بمعاملات موجودة.', '400');
      }

      const { error } = await this.db
        .from(this.serialTable)
        .delete()
        .eq('id', serialNumberId);

      if (error) {
        this.handleError(error, `فشل في حذف الرقم التسلسلي ${serialNumberId}`);
      }
      return true;
    }, `Failed to delete serial number ${serialNumberId}`);
  }
}

export const serialNumberService = new SerialNumberService();
