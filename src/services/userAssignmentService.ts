import { BaseService } from './base.service';
import { UserGroupAssignment, UserGroup, User } from '../types/database.types';
import { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';

export class UserAssignmentService extends BaseService {
  private assignmentTable = 'user_group_assignments';

  constructor() {
    super();
  }

  async assignUserToGroup(userId: string, groupId: number): Promise<UserGroupAssignment | null> {
    return this.executeWithRetry<UserGroupAssignment | null>(async () => {
      // Since a user can only be in one group (due to UNIQUE constraint on user_id),
      // we can use upsert to either create a new assignment or update an existing one.
      const { data, error }: PostgrestResponse<UserGroupAssignment> = await this.db
        .from(this.assignmentTable)
        .upsert({ user_id: userId, group_id: groupId }, { onConflict: 'user_id' })
        .select();

      if (error) {
        this.handleError(error, `Error assigning user ${userId} to group ${groupId}`);
        return null;
      }
      return data?.[0] || null;
    }, `Failed to assign user ${userId} to group ${groupId}`);
  }

  async removeUserFromGroup(userId: string): Promise<boolean> {
    // This effectively means removing their assignment row.
    return this.executeWithRetry<boolean>(async () => {
      const { error } = await this.db
        .from(this.assignmentTable)
        .delete()
        .eq('user_id', userId);

      if (error) {
        this.handleError(error, `Error removing user ${userId} from any group`);
        return false;
      }
      return true;
    }, `Failed to remove user ${userId} from group`);
  }

  async getUserGroup(userId: string): Promise<UserGroup | null> {
    return this.executeWithRetry<UserGroup | null>(async () => {
      const { data, error }: PostgrestSingleResponse<{ group_id: number, user_groups: UserGroup }> = await this.db
        .from(this.assignmentTable)
        .select(`
          group_id,
          user_groups (*)
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No assignment found
          return null;
        }
        this.handleError(error, `Error fetching group for user ${userId}`);
        return null;
      }
      return data?.user_groups || null;
    }, `Failed to fetch group for user ${userId}`);
  }

  async getUsersByGroup(groupId: number): Promise<User[]> {
    return this.executeWithRetry<User[]>(async () => {
      // This requires joining with the 'users' table (auth.users).
      // Supabase might not directly allow joining public schema tables with auth.users in client-side queries
      // without specific RLS or views. For now, we'll fetch user_ids and assume user details
      // would be fetched separately or this method would be used server-side (e.g. via Edge Functions).
      // A simpler approach for client-side might be to get assignments and then user details.

      // Simpler approach: Get assignments, then user details can be fetched by the caller.
      const { data, error } = await this.db
        .from(this.assignmentTable)
        .select('user_id, users (*)') // Assuming 'users' is a table/view accessible with user details
        .eq('group_id', groupId);

      if (error) {
        this.handleError(error, `Error fetching users for group ${groupId}`);
        return [];
      }

      // Assuming 'users' relation correctly fetches user details.
      // If 'users' is not a direct relation, you might get just user_ids
      // and then need to fetch user details separately.
      // The current User type in database.types.ts is a placeholder.
      // For now, this assumes 'users (*)' fetches the required User fields.
      return data?.map(item => item.users as User).filter(u => u !== null) || [];
    }, `Failed to fetch users for group ${groupId}`);
  }
}

export const userAssignmentService = new UserAssignmentService();
