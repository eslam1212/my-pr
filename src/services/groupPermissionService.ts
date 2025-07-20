import { BaseService } from './base.service';
import { GroupPermissionAssignment, Permission, UserGroup } from '../types/database.types';
import { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

export class GroupPermissionService extends BaseService {
  private assignmentTable = 'group_permission_assignments';
  private permissionTable = 'permissions'; // To fetch permission details

  constructor() {
    super();
  }

  async assignPermissionToGroup(groupId: number, permissionId: number): Promise<GroupPermissionAssignment | null> {
    return this.executeWithRetry<GroupPermissionAssignment | null>(async () => {
      // Check if assignment already exists
      const { data: existing, error: existingError } = await this.db
        .from(this.assignmentTable)
        .select('id')
        .eq('group_id', groupId)
        .eq('permission_id', permissionId)
        .maybeSingle();

      if (existingError && existingError.code !== 'PGRST116') { // PGRST116 means no rows, which is fine here
        this.handleError(existingError, `Error checking existing permission assignment for group ${groupId}`);
        return null;
      }
      if (existing) {
        // console.warn(`Permission ${permissionId} already assigned to group ${groupId}`);
        // Return the existing assignment or handle as an update if needed
        return existing as GroupPermissionAssignment; // Or fetch the full existing assignment
      }

      const { data, error }: PostgrestResponse<GroupPermissionAssignment> = await this.db
        .from(this.assignmentTable)
        .insert({ group_id: groupId, permission_id: permissionId })
        .select();

      if (error) {
        this.handleError(error, `Error assigning permission ${permissionId} to group ${groupId}`);
        return null;
      }
      return data?.[0] || null;
    }, `Failed to assign permission ${permissionId} to group ${groupId}`);
  }

  async removePermissionFromGroup(groupId: number, permissionId: number): Promise<boolean> {
    return this.executeWithRetry<boolean>(async () => {
      const { error } = await this.db
        .from(this.assignmentTable)
        .delete()
        .eq('group_id', groupId)
        .eq('permission_id', permissionId);

      if (error) {
        this.handleError(error, `Error removing permission ${permissionId} from group ${groupId}`);
        return false;
      }
      return true;
    }, `Failed to remove permission ${permissionId} from group ${groupId}`);
  }

  async getPermissionsForGroup(groupId: number): Promise<Permission[]> {
    return this.executeWithRetry<Permission[]>(async () => {
      const { data, error } = await this.db
        .from(this.assignmentTable)
        .select(`
          permission_id,
          permissions (id, name, description, created_at, updated_at)
        `)
        .eq('group_id', groupId);

      if (error) {
        this.handleError(error, `Error fetching permissions for group ${groupId}`);
        return [];
      }

      // Extract the permission objects from the nested structure
      return data?.map(item => (item.permissions as Permission)).filter(p => p !== null) || [];
    }, `Failed to fetch permissions for group ${groupId}`);
  }

  async getGroupsForPermission(permissionId: number): Promise<UserGroup[]> {
    return this.executeWithRetry<UserGroup[]>(async () => {
        const { data, error } = await this.db
            .from(this.assignmentTable)
            .select(`
                group_id,
                user_groups (id, group_name, description, created_at, updated_at)
            `)
            .eq('permission_id', permissionId);

        if (error) {
            this.handleError(error, `Error fetching groups for permission ${permissionId}`);
            return [];
        }
        return data?.map(item => (item.user_groups as UserGroup)).filter(g => g !== null) || [];
    }, `Failed to fetch groups for permission ${permissionId}`);
  }


  async setPermissionsForGroup(groupId: number, permissionIds: number[]): Promise<boolean> {
    return this.executeWithRetry<boolean>(async () => {
      // Begin transaction
      // Note: Supabase JS client doesn't directly support transactions in the same way as server-side SQL.
      // This will be a series of operations. For true atomicity, a plpgsql function would be better.

      // 1. Get current permissions for the group
      const { data: currentAssignments, error: currentError } = await this.db
        .from(this.assignmentTable)
        .select('permission_id')
        .eq('group_id', groupId);

      if (currentError) {
        this.handleError(currentError, `Error fetching current permissions for group ${groupId}`);
        return false;
      }
      const currentPermissionIds = currentAssignments?.map(a => a.permission_id) || [];

      // 2. Determine permissions to add and remove
      const permissionsToAdd = permissionIds.filter(id => !currentPermissionIds.includes(id));
      const permissionsToRemove = currentPermissionIds.filter(id => !permissionIds.includes(id));

      // 3. Add new permissions
      if (permissionsToAdd.length > 0) {
        const newAssignments = permissionsToAdd.map(permission_id => ({ group_id: groupId, permission_id }));
        const { error: addError } = await this.db.from(this.assignmentTable).insert(newAssignments);
        if (addError) {
          this.handleError(addError, `Error adding new permissions to group ${groupId}`);
          return false;
        }
      }

      // 4. Remove old permissions
      if (permissionsToRemove.length > 0) {
        const { error: removeError } = await this.db
          .from(this.assignmentTable)
          .delete()
          .eq('group_id', groupId)
          .in('permission_id', permissionsToRemove);
        if (removeError) {
          this.handleError(removeError, `Error removing old permissions from group ${groupId}`);
          return false;
        }
      }
      return true;
    }, `Failed to set permissions for group ${groupId}`);
  }
}

export const groupPermissionService = new GroupPermissionService();
