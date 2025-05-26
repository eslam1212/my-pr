import { BaseService } from './base.service';
import { UserGroup } from '../types/database.types'; // Assuming UserGroup is defined here
import { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

export class UserGroupService extends BaseService {
  private tableName = 'user_groups';

  constructor() {
    super();
  }

  async createUserGroup(groupData: Omit<UserGroup, 'id' | 'created_at' | 'updated_at'>): Promise<UserGroup | null> {
    return this.executeWithRetry<UserGroup | null>(async () => {
      const { data, error }: PostgrestResponse<UserGroup> = await this.db
        .from(this.tableName)
        .insert(groupData)
        .select();
      
      if (error) {
        this.handleError(error, 'Error creating user group');
        return null; // Should be unreachable due to handleError throwing
      }
      return data?.[0] || null;
    }, 'Failed to create user group');
  }

  async getUserGroupById(groupId: number): Promise<UserGroup | null> {
    return this.executeWithRetry<UserGroup | null>(async () => {
      const { data, error }: PostgrestSingleResponse<UserGroup> = await this.db
        .from(this.tableName)
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // PGRST116: "Query returned 0 rows"
          return null; 
        }
        this.handleError(error, `Error fetching user group with id ${groupId}`);
        return null;
      }
      return data;
    }, `Failed to fetch user group with id ${groupId}`);
  }

  async getUserGroupByName(groupName: string): Promise<UserGroup | null> {
    return this.executeWithRetry<UserGroup | null>(async () => {
      const { data, error }: PostgrestSingleResponse<UserGroup> = await this.db
        .from(this.tableName)
        .select('*')
        .eq('group_name', groupName)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        this.handleError(error, `Error fetching user group with name ${groupName}`);
        return null;
      }
      return data;
    }, `Failed to fetch user group with name ${groupName}`);
  }
  
  async getAllUserGroups(): Promise<UserGroup[]> {
    return this.executeWithRetry<UserGroup[]>(async () => {
      const { data, error }: PostgrestResponse<UserGroup> = await this.db
        .from(this.tableName)
        .select('*');

      if (error) {
        this.handleError(error, 'Error fetching all user groups');
        return []; // Should be unreachable
      }
      return data || [];
    }, 'Failed to fetch all user groups');
  }

  async updateUserGroup(groupId: number, updates: Partial<Omit<UserGroup, 'id' | 'created_at' | 'updated_at'>>): Promise<UserGroup | null> {
    return this.executeWithRetry<UserGroup | null>(async () => {
      const { data, error }: PostgrestResponse<UserGroup> = await this.db
        .from(this.tableName)
        .update(updates)
        .eq('id', groupId)
        .select();

      if (error) {
        this.handleError(error, `Error updating user group with id ${groupId}`);
        return null;
      }
      return data?.[0] || null;
    }, `Failed to update user group with id ${groupId}`);
  }

  async deleteUserGroup(groupId: number): Promise<boolean> {
    return this.executeWithRetry<boolean>(async () => {
      const { error } = await this.db
        .from(this.tableName)
        .delete()
        .eq('id', groupId);

      if (error) {
        this.handleError(error, `Error deleting user group with id ${groupId}`);
        return false;
      }
      return true;
    }, `Failed to delete user group with id ${groupId}`);
  }
}

export const userGroupService = new UserGroupService();
