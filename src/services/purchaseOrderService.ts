import { BaseService } from './base.service';
import { 
    PurchaseOrder, 
    PurchaseOrderItem, 
    PurchaseOrderStatus, 
    Product, 
    Supplier,
    UserProfile
} from '../types';
import { AppError } from '../utils/error-handler';
import { productService } from './product.service';
import { serialNumberService } from './serialNumberService';
import { inventoryService } from './inventory.service'; // Conceptual, for updateStockLevel
import { storageLocationService } from './storageLocationService';
import { authService } from './authService'; // To get current user for created_by_user_id

// Input types for creation to omit auto-generated fields
type PurchaseOrderCreateInput = Omit<PurchaseOrder, 'id' | 'po_number' | 'created_at' | 'updated_at' | 'total_amount' | 'status' | 'created_by_user_id' | 'items' | 'supplier' | 'created_by_user'> & {
  items: Array<Omit<PurchaseOrderItem, 'id' | 'purchase_order_id' | 'total_price' | 'received_quantity' | 'product'>>;
  po_number?: string; // Optional: if system should auto-generate
};

type PurchaseOrderItemCreateInput = Omit<PurchaseOrderItem, 'id' | 'purchase_order_id' | 'total_price' | 'received_quantity' | 'product'>;

interface ReceivedItemInfo {
  po_item_id: string; // UUID of PurchaseOrderItem
  quantity_received: number;
  location_id: string; // UUID of StorageLocation
  serial_numbers?: string[]; // Required if product is serial-tracked
}

export class PurchaseOrderService extends BaseService {
  private poTable = 'purchase_orders';
  private poItemTable = 'purchase_order_items';

  private async generatePoNumber(): Promise<string> {
    // Simple PO number generation, e.g., PO-YYYYMMDD-XXXX
    // In a real app, this might involve a sequence or a more robust unique ID generator.
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    // Fetch count of POs for the day to make it somewhat unique, or use a random part.
    // This is a simplified example.
    const { count, error } = await this.db.from(this.poTable).select('*', { count: 'exact', head: true }).gte('created_at', `${year}-${month}-${day}T00:00:00Z`);
    if (error) console.warn("Could not get PO count for PO number generation", error);
    const dailyCount = (count || 0) + 1;
    return `PO-${year}${month}${day}-${dailyCount.toString().padStart(4, '0')}`;
  }

  async createPurchaseOrder(input: PurchaseOrderCreateInput): Promise<PurchaseOrder> {
    // await userService.checkCurrentUserPermission('purchase_orders:create');
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) throw new AppError("المستخدم غير مصادق عليه.", "401");

    return this.executeWithRetry(async () => {
      const poNumber = input.po_number || await this.generatePoNumber();
      
      const poHeaderData = {
        po_number: poNumber,
        supplier_id: input.supplier_id,
        order_date: input.order_date,
        expected_delivery_date: input.expected_delivery_date || null,
        status: 'draft' as PurchaseOrderStatus, // Initial status
        notes: input.notes || null,
        shipping_address: input.shipping_address || null,
        created_by_user_id: currentUser.id,
        total_amount: 0, // Will be updated by trigger or manually after items
      };

      const { data: newPoHeader, error: headerError } = await this.db
        .from(this.poTable)
        .insert(poHeaderData)
        .select()
        .single();

      if (headerError || !newPoHeader) {
        if (headerError?.code === '23505') { // Unique violation for po_number
            throw new AppError(`رقم أمر الشراء ${poNumber} موجود بالفعل.`, '409', headerError.details);
        }
        this.handleError(headerError, 'فشل في إنشاء رأس أمر الشراء.');
        throw new AppError('فشل في إنشاء رأس أمر الشراء.'); // Ensure error is thrown
      }

      const itemsToInsert = input.items.map(item => ({
        ...item,
        product_id: parseInt(item.product_id as any), // product_id is BIGINT
        purchase_order_id: newPoHeader.id,
        // total_price will be calculated by DB trigger
        received_quantity: 0, // Default for new items
      }));
      
      const { data: newPoItems, error: itemsError } = await this.db
        .from(this.poItemTable)
        .insert(itemsToInsert)
        .select();

      if (itemsError || !newPoItems || newPoItems.length === 0) {
        // Attempt to delete the created PO header if items fail (basic rollback)
        await this.db.from(this.poTable).delete().eq('id', newPoHeader.id);
        this.handleError(itemsError, 'فشل في إضافة بنود أمر الشراء.');
        throw new AppError('فشل في إضافة بنود أمر الشراء.'); // Ensure error is thrown
      }
      
      // Fetch the PO again to get total_amount updated by trigger
      return this.getPurchaseOrderById(newPoHeader.id);
    }, 'Failed to create purchase order.');
  }

  async getPurchaseOrderById(id: string): Promise<PurchaseOrder> {
    // await userService.checkCurrentUserPermission('purchase_orders:read');
    return this.executeWithRetry(async () => {
      const { data, error } = await this.db
        .from(this.poTable)
        .select(`
          *,
          supplier:suppliers (id, name, email),
          created_by_user:users (id, username, email),
          items:purchase_order_items (
            *,
            product:products (id, name, sku, is_serial_tracked)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error || !data) {
        this.handleError(error, `فشل في جلب أمر الشراء بالمعرف ${id}.`);
        throw new AppError(`أمر الشراء ${id} غير موجود.`, '404');
      }
      return data as PurchaseOrder;
    }, `Failed to fetch purchase order ${id}.`);
  }

  async listPurchaseOrders(filters: {
    status?: PurchaseOrderStatus | string;
    supplierId?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}): Promise<PurchaseOrder[]> {
    // await userService.checkCurrentUserPermission('purchase_orders:read');
    return this.executeWithRetry(async () => {
      let query = this.db.from(this.poTable).select(`
        *,
        supplier:suppliers (id, name)
      `);

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.supplierId) query = query.eq('supplier_id', filters.supplierId);
      if (filters.dateFrom) query = query.gte('order_date', filters.dateFrom);
      if (filters.dateTo) query = query.lte('order_date', filters.dateTo);
      
      query = query.order('order_date', { ascending: false });

      const { data, error } = await query;
      if (error) {
        this.handleError(error, 'فشل في تحميل قائمة أوامر الشراء.');
      }
      return (data as PurchaseOrder[]) || [];
    }, 'Failed to list purchase orders.');
  }

  async updatePurchaseOrderStatus(id: string, status: PurchaseOrderStatus): Promise<PurchaseOrder> {
    // await userService.checkCurrentUserPermission('purchase_orders:update_status');
    return this.executeWithRetry(async () => {
      const { data, error } = await this.db
        .from(this.poTable)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) this.handleError(error, `فشل في تحديث حالة أمر الشراء ${id}.`);
      return data as PurchaseOrder;
    }, `Failed to update status for PO ${id}.`);
  }
  
  async updatePurchaseOrderItem(
    poItemId: string, 
    updates: Partial<Omit<PurchaseOrderItem, 'id' | 'purchase_order_id' | 'product_id' | 'total_price' | 'product'>>
  ): Promise<PurchaseOrderItem> {
    // await userService.checkCurrentUserPermission('purchase_orders:edit_items'); // Or broader PO edit perm
    // Ensure received_quantity is not part of updates here if it's handled by receiveGoods
    if (typeof updates.received_quantity !== 'undefined') {
        throw new AppError("لا يمكن تحديث الكمية المستلمة مباشرة. استخدم عملية استلام البضائع.", "400");
    }

    return this.executeWithRetry(async () => {
        const { data, error } = await this.db
            .from(this.poItemTable)
            .update(updates)
            .eq('id', poItemId)
            .select('*, product:products(id, name, sku, is_serial_tracked)')
            .single();

        if (error) this.handleError(error, `فشل في تحديث بند أمر الشراء ${poItemId}.`);
        return data as PurchaseOrderItem;
    }, `Failed to update PO item ${poItemId}.`);
  }


  async receiveGoods(
    purchaseOrderId: string, 
    receivedItemsInfo: ReceivedItemInfo[]
  ): Promise<PurchaseOrder> {
    // await userService.checkCurrentUserPermission('inventory:receive_goods');
    // This is a complex operation that should ideally be a single database transaction.
    // The following is a sequential implementation.

    return this.executeWithRetry(async () => {
      const po = await this.getPurchaseOrderById(purchaseOrderId);
      if (!po) throw new AppError(`أمر الشراء ${purchaseOrderId} غير موجود.`);
      if (po.status === 'fully_received' || po.status === 'cancelled') {
        throw new AppError(`أمر الشراء ${po.po_number} مغلق بالفعل أو ملغى.`);
      }

      for (const receivedItem of receivedItemsInfo) {
        const poItem = po.items?.find(item => item.id === receivedItem.po_item_id);
        if (!poItem) throw new AppError(`بند أمر الشراء ${receivedItem.po_item_id} غير موجود في أمر الشراء ${po.po_number}.`);
        
        const product = poItem.product; // Product details should be joined in getPurchaseOrderById
        if (!product) throw new AppError(`تفاصيل المنتج للبند ${poItem.id} غير موجودة.`);

        if (receivedItem.quantity_received <= 0) continue; // Skip if nothing received for this item

        const newReceivedQuantity = (poItem.received_quantity || 0) + receivedItem.quantity_received;
        if (newReceivedQuantity > poItem.quantity) {
          throw new AppError(`الكمية المستلمة (${newReceivedQuantity}) للمنتج ${product.name} تتجاوز الكمية المطلوبة (${poItem.quantity}).`);
        }

        // Update received_quantity for the PO item
        const { error: updatePoItemError } = await this.db
          .from(this.poItemTable)
          .update({ received_quantity: newReceivedQuantity })
          .eq('id', poItem.id);
        if (updatePoItemError) throw new AppError(`فشل تحديث الكمية المستلمة للبند ${product.name}: ${updatePoItemError.message}`);

        // Update stock levels
        if (product.is_serial_tracked) {
          if (!receivedItem.serial_numbers || receivedItem.serial_numbers.length !== receivedItem.quantity_received) {
            throw new AppError(`عدد الأرقام التسلسلية (${receivedItem.serial_numbers?.length || 0}) لا يطابق الكمية المستلمة (${receivedItem.quantity_received}) للمنتج ${product.name}.`);
          }
          for (const snValue of receivedItem.serial_numbers) {
            const newSerial = await serialNumberService.createSerialNumberEntry(
              product.id, 
              snValue, 
              'in_stock', 
              receivedItem.location_id
            );
            // Link serial number to this PO item via transaction_item_serials
            await serialNumberService.addSerialNumberToTransaction(
                newSerial.id,
                parseInt(poItem.id as any), // Assuming poItem.id is UUID, this needs conversion or direct use if types match
                'purchase_order_item_id', // This FK needs to be UUID in transaction_item_serials
                'purchase_receipt'
            );
          }
        } else {
          // This relies on the conceptual inventoryService.updateStockLevel
          await inventoryService.updateStockLevel(
            product.id, 
            receivedItem.location_id, 
            receivedItem.quantity_received,
            product.name
          );
        }
      }

      // Check if all items are fully received to update PO status
      const updatedPo = await this.getPurchaseOrderById(purchaseOrderId); // Re-fetch to get latest item statuses
      const allItemsFullyReceived = updatedPo.items?.every(item => item.received_quantity >= item.quantity);
      let newStatus = po.status;
      if (allItemsFullyReceived) {
        newStatus = 'fully_received';
      } else if (updatedPo.items?.some(item => item.received_quantity > 0)) {
        newStatus = 'partially_received';
      }
      
      if (newStatus !== po.status) {
        return this.updatePurchaseOrderStatus(purchaseOrderId, newStatus);
      }
      return updatedPo;

    }, `Failed to receive goods for PO ${purchaseOrderId}.`);
  }
}

export const purchaseOrderService = new PurchaseOrderService();
