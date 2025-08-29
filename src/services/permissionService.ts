import { BaseService } from './base.service';
import { Permission } from '../types/database.types';
import { PostgrestResponse } from '@supabase/supabase-js';

export class PermissionService extends BaseService {
  private tableName = 'permissions';

  constructor() {
    super();
  }

  async getAllPermissions(): Promise<Permission[]> {
    return this.executeWithRetry<Permission[]>(async () => {
      const { data, error }: PostgrestResponse<Permission> = await this.db
        .from(this.tableName)
        .select('*')
        .order('name', { ascending: true }); // Order by name for consistent listing

      if (error) {
        this.handleError(error, 'Error fetching all permissions');
        return []; // Should be unreachable
      }
      return data || [];
    }, 'Failed to fetch all permissions');
  }

  // Potential future methods:
  // async getPermissionById(permissionId: number): Promise<Permission | null> { ... }
  // async getPermissionByName(name: string): Promise<Permission | null> { ... }
  // For now, these are not strictly necessary as permissions are seeded and managed via migration.
}

export const permissionService = new PermissionService();
