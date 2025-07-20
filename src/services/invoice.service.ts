import { BaseService } from './base.service';
import { Invoice, InvoiceItem, Product as ProductType } from '../types'; // Added ProductType
import { userService } from './userService';
import { AppError } from '../utils/error-handler';
import { productService } from './product.service'; // Import productService
import { serialNumberService } from './serialNumberService'; // Import serialNumberService
  private async checkPermission(permission: string) {
    const hasPermission = await userService.checkCurrentUserPermission(permission);
    if (!hasPermission) {
      throw new AppError(`Unauthorized: Missing permission ${permission}`, '403', 'User does not have the required permission.');
    }
  }

  async getAll() {
    // Optional: Check for 'invoices:read' permission if needed
    // await this.checkPermission('invoices:read');
    try {
      const { data, error } = await this.db
        .from('invoices')
        .select(`
          *,
          customer:customers(
            id,
            name,
            email,
            phone
          ),
          supplier:suppliers(
            id,
            name,
            email,
            phone
          ),
          items:invoice_items(
            *,
            product:products(
              id,
              name,
              sku
            )
          )
        `);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      return this.handleError(error, 'فشل في تحميل الفواتير');
    }
  }

  async getById(id: string) {
    // Optional: Check for 'invoices:read' permission if needed
    // await this.checkPermission('invoices:read');
    try {
      const { data, error } = await this.db
        .from('invoices')
        .select(`
          *,
          customer:customers(
            id,
            name,
            email,
            phone
          ),
          supplier:suppliers(
            id,
            name,
            email,
            phone
          ),
          items:invoice_items(
            *,
            product:products(
              id,
              name,
              sku
            )
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return this.handleError(error, 'فشل في تحميل بيانات الفاتورة');
    }
  }

  async create(invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'> & { items: Array<Omit<InvoiceItem, 'id' | 'invoice_id' | 'created_at' | 'updated_at'>>; }) {
    await this.checkPermission('invoices:create');
    const { items: itemPayloads, ...invoiceData } = invoice;

    // --- BEGIN DATABASE TRANSACTION (Conceptual) ---
    // Supabase client library doesn't offer direct multi-statement transaction control.
    // For atomicity, this entire block should be a single pgSQL function called via RPC.
    // The following is a sequential implementation. If any step fails, manual rollback or compensation would be needed.

    try {
      // 1. Validate serial numbers for tracked products BEFORE creating invoice
      for (const item of itemPayloads) {
        const productDetails = await productService.getById(item.product_id.toString()); // Assuming getById takes string ID
        if (!productDetails) {
          throw new AppError(`المنتج بالمعرف ${item.product_id} غير موجود في بيانات الفاتورة.`);
        }
        if (productDetails.is_serial_tracked) {
          if (!item.serial_numbers_provided || item.serial_numbers_provided.length !== item.quantity) {
            throw new AppError(`المنتج ${productDetails.name} يتطلب ${item.quantity} رقم تسلسلي، لكن تم توفير ${item.serial_numbers_provided?.length || 0}.`);
          }
          const availabilityMap = await serialNumberService.checkAvailability(productDetails.id, item.serial_numbers_provided);
          for (const snValue of item.serial_numbers_provided) {
            const snRecord = availabilityMap.get(snValue);
            if (!snRecord || snRecord.status !== 'in_stock') {
              throw new AppError(`الرقم التسلسلي ${snValue} للمنتج ${productDetails.name} غير متوفر أو ليس في المخزون.`);
            }
          }
        }
      }

      // 2. Create the invoice header
      const { data: newInvoice, error: invoiceError } = await this.db
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (invoiceError) throw invoiceError;
      if (!newInvoice) throw new AppError('فشل في إنشاء رأس الفاتورة.');

      // 3. Create invoice items and process serial numbers
      const createdInvoiceItems: InvoiceItem[] = [];
      for (const item of itemPayloads) {
        const { serial_numbers_provided, ...itemData } = item; // Separate serials from item data

        const { data: newInvoiceItem, error: itemError } = await this.db
          .from('invoice_items')
          .insert({
            ...itemData,
            invoice_id: newInvoice.id,
          })
          .select()
          .single();

        if (itemError) {
          // TODO: Rollback - delete newInvoice header if items fail. Complex without transactions.
          throw new AppError(`فشل في إضافة بند الفاتورة للمنتج ID ${itemData.product_id}: ${itemError.message}`);
        }
        if (!newInvoiceItem) throw new AppError('فشل في إنشاء بند الفاتورة.');

        createdInvoiceItems.push(newInvoiceItem as InvoiceItem);

        // Process serial numbers if applicable
        const productDetails = await productService.getById(item.product_id.toString()); // Re-fetch or pass from validation step
        if (productDetails?.is_serial_tracked && serial_numbers_provided) {
          for (const snValue of serial_numbers_provided) {
            const snRecord = await serialNumberService.getSerialNumberDetails(snValue, productDetails.id);
            if (snRecord && snRecord.status === 'in_stock') {
              // Update serial number status and link to invoice item
              await serialNumberService.updateSerialNumber(snRecord.id, {
                status: 'sold',
                invoice_item_id: newInvoiceItem.id // Link SN directly to invoice_item
              });
              // Create a record in transaction_item_serials
              await serialNumberService.addSerialNumberToTransaction(
                snRecord.id,
                newInvoiceItem.id,
                'invoice_item_id',
                'sale'
              );
            } else {
              // This case should ideally be caught by pre-validation.
              // If it happens, it's a critical error, consider rollback.
              console.error(`الرقم التسلسلي ${snValue} لم يعد صالحًا أو تم التحقق منه بشكل غير صحيح.`);
              throw new AppError(`خطأ حرج: الرقم التسلسلي ${snValue} غير صالح للمعالجة.`);
            }
          }
        }
      }

      // --- END DATABASE TRANSACTION (Conceptual) ---

      return this.getById(newInvoice.id.toString()); // Fetch the full invoice with details
    } catch (error) {
      // More sophisticated error handling/rollback needed in a real scenario without DB transactions
      console.error("Error during invoice creation with serial numbers:", error);
      if (error instanceof AppError) return this.handleError(error, error.message);
      return this.handleError(error, 'فشل في إنشاء الفاتورة مع تتبع الأرقام التسلسلية.');
    }
  }

  async update(id: string, invoice: Partial<Invoice>) {
    await this.checkPermission('invoices:update');
    try {
      const { data, error } = await this.db
        .from('invoices')
        .update(invoice)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return this.handleError(error, 'فشل في تحديث الفاتورة');
    }
  }

  async delete(id: string) {
    await this.checkPermission('invoices:delete');
    try {
      const { error } = await this.db
        .from('invoices')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    } catch (error) {
      return this.handleError(error, 'فشل في حذف الفاتورة');
    }
  }
}

export const invoiceService = new InvoiceService();
