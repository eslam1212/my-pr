import { BaseService } from './base.service';
import { Product } from '../types';
import { AppError } from '../utils/error-handler';
import { userService } from './userService'; // Import userService

class ProductService extends BaseService {
  private async checkPermission(permission: string) {
    const hasPermission = await userService.checkCurrentUserPermission(permission);
    if (!hasPermission) {
      throw new AppError(`Unauthorized: Missing permission ${permission}`, '403', 'User does not have the required permission.');
    }
  }

  async getAll() {
    // Optional: Check for 'products:read' permission if needed
    // await this.checkPermission('products:read');
    try {
      const { data, error } = await this.db
        .from('products')
        .select('*');
      
      if (error) {
        throw new AppError('فشل في تحميل المنتجات', error.code, error.details);
      }
      
      // Add default unit field to products
      const productsWithUnit = (data || []).map(product => ({
        ...product,
        unit: product.unit || 'piece', // Default to 'piece' if unit is missing
        minQuantity: product.min_quantity // Map min_quantity to minQuantity for frontend
      }));
      
      return productsWithUnit;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('فشل في تحميل المنتجات');
    }
  }

  async create(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
    await this.checkPermission('products:create');
    try {
      // Ensure is_serial_tracked is explicitly boolean, defaulting to false if undefined
      const productData = {
        ...product,
        is_serial_tracked: product.is_serial_tracked ?? false,
        barcode: product.barcode || null, // Ensure barcode is null if empty string or undefined
        reorder_level: product.reorder_level ?? 0, // Default to 0 if not provided
        preferred_stock_level: product.preferred_stock_level ?? 0, // Default to 0 if not provided
       };

      // Remove the unit field if it's part of the Product type but not in DB schema directly
      // (This was from previous context, assuming 'unit' might be handled differently or was a temporary field)
      // If 'unit' is a direct column in 'products' table, this delete is not needed.
      // Based on previous types, 'unit' is a column. So, this specific delete might be legacy.
      // Let's assume 'unit' is a valid column for now unless errors arise.
      // if ('unit' in productData && typeof (productData as any).unit === 'undefined') {
      //   delete (productData as any).unit; // Avoid sending undefined unit
      // }

      // Log the data being sent to the database for debugging
      console.log('Sending product data to database:', productData);
      
      const { data, error } = await this.db
        .from('products')
        .insert(productData)
        .select()
        .single();
      
      if (error) {
        console.error('Database error details:', error);
        if (error.code === '23505' && error.message.includes('idx_products_barcode_unique_not_null')) {
          throw new AppError('فشل في إضافة المنتج: رمز الباركود المدخل موجود مسبقًا لمنتج آخر.', error.code, error.details);
        }
        throw new AppError('فشل في إضافة المنتج', error.code, error.details);
      }
      
      return data as Product; // Cast to Product to ensure type consistency
    } catch (error) {
      console.error('Full error object:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('فشل في إضافة المنتج');
    }
  }

  async update(id: string, productUpdates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>) {
    await this.checkPermission('products:update');
    try {
      const updateData = { ...productUpdates };

      // Ensure barcode is null if empty string, or keep undefined to not update if not provided
      if (updateData.barcode === '') {
        updateData.barcode = null;
      }
      // Ensure reorder_level and preferred_stock_level are numbers, default to 0 if undefined in partial update
      if ('reorder_level' in updateData && typeof updateData.reorder_level === 'undefined') {
        updateData.reorder_level = 0;
      }
      if ('preferred_stock_level' in updateData && typeof updateData.preferred_stock_level === 'undefined') {
        updateData.preferred_stock_level = 0;
      }
      
      // Handle minQuantity to min_quantity conversion if frontend uses minQuantity
      if ('minQuantity' in updateData && typeof updateData.minQuantity !== 'undefined') {
        (updateData as any).min_quantity = updateData.minQuantity;
        delete (updateData as any).minQuantity;
      }
      
      const { data, error } = await this.db
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Database error details:', error);
         if (error.code === '23505' && error.message.includes('idx_products_barcode_unique_not_null')) {
          throw new AppError('فشل في تحديث المنتج: رمز الباركود المدخل موجود مسبقًا لمنتج آخر.', error.code, error.details);
        }
        throw new AppError('فشل في تحديث المنتج', error.code, error.details);
      }
      
      return data as Product;
    } catch (error) {
      console.error('Full error object:', error);
      if (error instanceof AppError) throw error;
      throw new AppError('فشل في تحديث المنتج');
    }
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    // Optional: Check for 'products:read' permission or a more specific barcode scan permission
    // await this.checkPermission('products:read');
    try {
      if (!barcode || barcode.trim() === '') {
        return null;
      }
      const { data, error } = await this.db
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .maybeSingle(); // Use maybeSingle to return null if not found, instead of error

      if (error) {
        console.error('Error finding product by barcode:', error);
        // Don't throw AppError here for not found, just log and return null or let specific error codes pass
        if (error.code === 'PGRST116') { // Resource not found by PostgREST
             return null;
        }
        throw new AppError('خطأ أثناء البحث عن المنتج بالباركود', error.code, error.details);
      }

      if (!data) return null;

      // Map min_quantity to minQuantity for frontend consistency
      return {
        ...data,
        unit: data.unit || 'piece',
        minQuantity: data.min_quantity
      } as Product;

    } catch (error) {
      if (error instanceof AppError) throw error;
      // Avoid throwing generic error for "not found" cases if maybeSingle handles it.
      // But if other errors occur, wrap them.
      console.error('Unexpected error in findByBarcode:', error);
      throw new AppError('خطأ غير متوقع أثناء البحث بالباركود');
    }
  }

  async delete(id: string) {
    await this.checkPermission('products:delete');
    try {
      const { error } = await this.db
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new AppError('فشل في حذف المنتج', error.code, error.details);
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('فشل في حذف المنتج');
    }
  }
}

export const productService = new ProductService();
