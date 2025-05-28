import { BaseService } from './base.service';
import { StorageLocation } from '../types'; // Using the updated types
import { AppError } from '../utils/error-handler';
// import { userService } from './userService'; // For permission checks if needed

export class StorageLocationService extends BaseService {
  private tableName = 'storage_locations';

  // Optional: Permission check helper for location-specific actions
  // private async checkPermission(permission: string) {
  //   const hasPermission = await userService.checkCurrentUserPermission(permission);
  //   if (!hasPermission) {
  //     throw new AppError(`Unauthorized: Missing permission ${permission}`, '403', 'User does not have the required permission.');
  //   }
  // }

  async create(locationData: Omit<StorageLocation, 'id' | 'created_at' | 'updated_at'>): Promise<StorageLocation> {
    // await this.checkPermission('settings:locations:manage'); // Example permission
    return this.executeWithRetry(async () => {
      // If is_default is true, the database trigger 'trigger_ensure_single_default_location'
      // should handle unsetting other defaults.
      const { data, error } = await this.db
        .from(this.tableName)
        .insert(locationData)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation (e.g., name)
          throw new AppError('موقع التخزين بهذا الاسم موجود بالفعل.', '409', error.details);
        }
        this.handleError(error, 'فشل في إنشاء موقع التخزين.');
      }
      return data as StorageLocation;
    }, 'Failed to create storage location');
  }

  async getById(id: string): Promise<StorageLocation | null> {
    // await this.checkPermission('settings:locations:view');
    return this.executeWithRetry(async () => {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .maybeSingle(); // Returns null if not found, no error thrown by PostgREST

      if (error) { // Handle other errors, not "not found"
          this.handleError(error, `فشل في جلب موقع التخزين بالمعرف ${id}.`);
      }
      return data as StorageLocation | null;
    }, `Failed to fetch storage location with ID ${id}`);
  }

  async getAll(): Promise<StorageLocation[]> {
    // await this.checkPermission('settings:locations:view');
    return this.executeWithRetry(async () => {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        this.handleError(error, 'فشل في تحميل مواقع التخزين.');
      }
      return (data as StorageLocation[]) || [];
    }, 'Failed to fetch all storage locations');
  }
  
  async getDefaultLocation(): Promise<StorageLocation | null> {
    return this.executeWithRetry(async () => {
      const { data, error } = await this.db
        .from(this.tableName)
        .select('*')
        .eq('is_default', true)
        .maybeSingle(); // There should be only one or none

      if (error) {
        this.handleError(error, 'فشل في تحميل الموقع الافتراضي.');
      }
      return data as StorageLocation | null;
    }, 'Failed to fetch default storage location');
  }


  async update(id: string, updates: Partial<Omit<StorageLocation, 'id' | 'created_at' | 'updated_at'>>): Promise<StorageLocation> {
    // await this.checkPermission('settings:locations:manage');
    return this.executeWithRetry(async () => {
      // If is_default is being set to true, the trigger will handle unsetting others.
      // If is_default is being set to false, ensure there's at least one other default,
      // or prevent unsetting if it's the only one (application logic or another trigger).
      // For simplicity, current trigger only acts when NEW.is_default = TRUE.
      // Consider adding logic here if a default location is always required.
      
      if (updates.is_default === false) {
        const currentLocation = await this.getById(id);
        if (currentLocation?.is_default) {
            const allLocations = await this.getAll();
            const otherDefaults = allLocations.filter(loc => loc.is_default && loc.id !== id);
            if (otherDefaults.length === 0) {
                // Optionally prevent unsetting the last default, or handle as per business rules
                // For now, we allow it. The trigger only works on setting to TRUE.
                // To enforce at least one default, more complex logic/trigger is needed.
            }
        }
      }


      const { data, error } = await this.db
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
         if (error.code === '23505') {
          throw new AppError('موقع التخزين بهذا الاسم موجود بالفعل.', '409', error.details);
        }
        this.handleError(error, `فشل في تحديث موقع التخزين ${id}.`);
      }
      return data as StorageLocation;
    }, `Failed to update storage location ${id}`);
  }
  
  async setAsDefault(locationId: string): Promise<StorageLocation> {
    // This method explicitly sets a location as default.
    // The database trigger 'trigger_ensure_single_default_location' will handle
    // unsetting any other location that might currently be default.
    // await this.checkPermission('settings:locations:manage');
    return this.update(locationId, { is_default: true });
  }


  async delete(id: string): Promise<boolean> {
    // await this.checkPermission('settings:locations:manage');
    return this.executeWithRetry(async () => {
      // Before deleting, check if this location is used in product_stock_levels or serial_numbers
      // Or rely on foreign key constraints (ON DELETE RESTRICT/SET NULL).
      // Current FKs are ON DELETE SET NULL for serial_numbers.location_id
      // and ON DELETE CASCADE for product_stock_levels.location_id.
      // Cascade delete for product_stock_levels means deleting a location will delete stock level records.
      // This might be desired, or might need prevention if quantity > 0.
      // For serial_numbers, location_id will become NULL.

      // Check if it's a default location. If so, prevent deletion or handle default change.
      const location = await this.getById(id);
      if (location?.is_default) {
        throw new AppError('لا يمكن حذف الموقع الافتراضي. يرجى تعيين موقع آخر كافتراضي أولاً.', '400');
      }

      // Check product_stock_levels (non-serial tracked products)
      const { data: stockLevels, error: stockError } = await this.db
        .from('product_stock_levels')
        .select('product_id, quantity')
        .eq('location_id', id)
        .gt('quantity', 0) // Check for locations with actual stock
        .limit(1);

      if (stockError) {
        this.handleError(stockError, `فشل في التحقق من مستويات المخزون للموقع ${id}.`);
      }
      if (stockLevels && stockLevels.length > 0) {
        throw new AppError('لا يمكن حذف الموقع لأنه يحتوي على مخزون لمنتجات غير متسلسلة. قم بنقل المخزون أولاً.', '400');
      }
      
      // Check serial_numbers (serial tracked products)
       const { data: serials, error: serialError } = await this.db
        .from('serial_numbers')
        .select('id')
        .eq('location_id', id)
        .limit(1);
        
      if (serialError) {
        this.handleError(serialError, `فشل في التحقق من الأرقام التسلسلية للموقع ${id}.`);
      }
      if (serials && serials.length > 0) {
         // Since ON DELETE SET NULL is used, serials won't be deleted but their location_id will be nullified.
         // Depending on business logic, user might need to transfer them first.
         // For now, we'll allow it, and they become "unlocated".
         // Could add a confirmation step or stricter check if needed.
         console.warn(`Location ${id} has serial numbers; their location will be set to NULL.`);
      }


      const { error } = await this.db
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        this.handleError(error, `فشل في حذف موقع التخزين ${id}.`);
      }
      return true;
    }, `Failed to delete storage location ${id}`);
  }
}

export const storageLocationService = new StorageLocationService();
