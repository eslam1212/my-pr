import { supabase } from '../lib/supabase';
import { UserFormData } from '../types/auth'; // This might need to be UserProfile from database.types.ts
import { UserProfile } from '../types/database.types'; // Import UserProfile
import { userAssignmentService } from './userAssignmentService';
import { groupPermissionService } from './groupPermissionService';
import { authService } from './authService'; // To get current user if needed
import { twoFactorAuthUtils } from '../utils/2fa'; // Import 2FA utils for mock data generation

// Define interfaces for conceptual Edge Function payloads
interface Generate2FAResponse {
  secret: string; // base32 secret
  otpauth_url: string;
  qr_code_data_url?: string; // Optional: if Edge Function generates QR too
}

interface Enable2FARequest {
  secret: string; // The base32 secret being confirmed
  token: string;  // The TOTP token from authenticator app
}

interface Enable2FAResponse {
  success: boolean;
  backup_codes?: string[]; // Plain text for one-time display
}

interface Disable2FAResponse {
  success: boolean;
}

interface RegenerateBackupCodesResponse {
    success: boolean;
    backup_codes?: string[];
}


export const userService = {
  // Helper function to check user permission
  async checkUserPermission(userId: string, permissionName: string): Promise<boolean> {
    if (!userId || !permissionName) {
      console.warn('User ID and permission name are required for permission check.');
      return false;
    }

    try {
      const userGroup = await userAssignmentService.getUserGroup(userId);
      if (!userGroup) {
        console.log(`User ${userId} is not assigned to any group.`);
        return false; // Or handle default permissions for users without a group
      }

      const groupPermissions = await groupPermissionService.getPermissionsForGroup(userGroup.id);
      if (!groupPermissions || groupPermissions.length === 0) {
        console.log(`Group ${userGroup.group_name} (ID: ${userGroup.id}) has no permissions assigned.`);
        return false;
      }

      const hasPermission = groupPermissions.some(p => p.name === permissionName);
      if (hasPermission) {
        console.log(`User ${userId} HAS permission "${permissionName}" via group "${userGroup.group_name}".`);
      } else {
        console.log(`User ${userId} DOES NOT HAVE permission "${permissionName}" via group "${userGroup.group_name}".`);
      }
      return hasPermission;

    } catch (error) {
      console.error(`Error checking permission "${permissionName}" for user ${userId}:`, error);
      return false;
    }
  },

  // Convenience function to check permission for the currently authenticated user
  async checkCurrentUserPermission(permissionName: string): Promise<boolean> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        console.warn('No authenticated user found for permission check.');
        return false;
      }
      return this.checkUserPermission(user.id, permissionName);
    } catch (error) {
      console.error(`Error checking permission "${permissionName}" for current user:`, error);
      return false;
    }
  },

  // إنشاء مستخدم جديد
  async createUser(user: UserFormData) {
    try {
      // التحقق من صحة البيانات المدخلة (يمكن استخدام مكتبة مثل zod أو yup)
      if (!user.email || !user.password) {
        throw new Error('البريد الإلكتروني وكلمة المرور مطلوبان');
      }

      // إنشاء مستخدم في نظام المصادقة
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        // options: { data: { role: user.role } } // Example if you want to set a default role or metadata
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('User not created in auth.');
      }

      // إضافة المستخدم إلى جدول users (public.users for profile)
      // Ensure this 'user' object aligns with the fields in your public.users table.
      // The id should come from authData.user.id
      const profileData = {
        id: authData.user.id, // Link to auth.users
        email: user.email,    // Store email in profile if needed
        username: user.username, // Assuming username is part of UserFormData
        role: user.role,         // Store initial role if provided
        // any other fields from UserFormData that go into the profile
      };

      const { data, error } = await supabase
        .from('users') // This refers to your public.users profile table
        .insert(profileData)
        .select('*')
        .single();

      if (error) {
        console.error('Profile creation error:', error);
        // Consider cleanup: if profile creation fails, should the auth user be deleted?
        // This can be complex to handle robustly.
        throw error;
      }

      // Optionally, assign user to a default group upon creation
      // For example, assign to a "Default User" group if one exists
      // const defaultGroup = await userGroupService.getUserGroupByName('Default User');
      // if (defaultGroup) {
      //   await userAssignmentService.assignUserToGroup(authData.user.id, defaultGroup.id);
      // }

      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      // Ensure the thrown error is informative
      if (error instanceof Error && (error.message.includes('unique constraint') || error.message.includes('duplicate key'))) {
        throw new Error('المستخدم موجود بالفعل أو البريد الإلكتروني مستخدم.');
      }
      throw new Error('فشل في إنشاء المستخدم: ' + (error instanceof Error ? error.message : String(error)));
    }
  },

  // تحديث مستخدم موجود
  async updateUser(userId: string, updatedUser: Partial<UserFormData>) { // UserFormData might need to be a more specific ProfileUpdateType
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updatedUser)
        .eq('id', userId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('فشل في تحديث المستخدم');
    }
  },

  // جلب جميع المستخدمين
  async getAllUsers() {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('فشل في جلب المستخدمين');
    }
  },

  // جلب مستخدم بواسطة ID
  async getUserById(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('فشل في جلب المستخدم');
    }
  },

  // حذف مستخدم
  async deleteUser(userId: string) {
    try {
      // 1. Remove user from any group assignments
      await userAssignmentService.removeUserFromGroup(userId);

      // 2. Delete user from public.users (profile table)
      const { error: profileError } = await supabase.from('users').delete().eq('id', userId);
      if (profileError) {
        // Log error but proceed to delete auth user if possible, as that's more critical.
        console.error('Error deleting user profile:', profileError);
      }

      // 3. Delete user from auth.users (Supabase Auth)
      // This requires admin privileges and is typically done via a server-side function.
      // The client-side Supabase library cannot delete other users.
      // For now, we'll comment this out and assume deletion from 'users' table is sufficient for client-side.
      // If you have an Edge Function for this:
      // const { error: authUserError } = await supabase.functions.invoke('delete-auth-user', { body: { userId } });
      // if (authUserError) throw authUserError;

      // If only deleting from public.users:
      if (profileError) throw profileError;

    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('فشل في حذف المستخدم: ' + (error instanceof Error ? error.message : String(error)));
    }
  },

  // --- 2FA Management Methods ---

  /**
   * Calls an Edge Function to generate a new 2FA secret and QR code URL.
   * (Mocked for now)
   */
  async generateTwoFactorSecret(): Promise<Generate2FAResponse> {
    const currentUser = await authService.getCurrentUser();
    if (!currentUser || !currentUser.email) {
      throw new Error('User not authenticated or email missing.');
    }
    // In a real scenario, this would be an Edge Function call:
    // const { data, error } = await supabase.functions.invoke('generate-2fa-secret');
    // if (error) throw error;
    // return data as Generate2FAResponse;

    // Mock implementation:
    console.log_once('userService.generateTwoFactorSecret: Using mocked implementation.');
    const secretInfo = twoFactorAuthUtils.generateSecret(currentUser.email);
    // const qrCodeDataUrl = await twoFactorAuthUtils.generateQRCodeDataURL(secretInfo.otpauth_url!);
    return {
      secret: secretInfo.base32, // The secret itself
      otpauth_url: secretInfo.otpauth_url!, // For QR code generation on client
      // qr_code_data_url: qrCodeDataUrl, // Or if Edge function generates it
    };
  },

  /**
   * Calls an Edge Function to verify the TOTP token and enable 2FA for the user.
   * (Mocked for now)
   * @param {string} secret - The base32 secret that was used to generate the QR code.
   * @param {string} token - The TOTP token from the authenticator app.
   */
  async enableTwoFactor(payload: Enable2FARequest): Promise<Enable2FAResponse> {
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated.');

    // In a real scenario, this would be an Edge Function call:
    // const { data, error } = await supabase.functions.invoke('enable-2fa', { body: payload });
    // if (error) throw error;
    // return data as Enable2FAResponse;

    // Mock implementation:
    console.log_once('userService.enableTwoFactor: Using mocked implementation.');
    const isValid = twoFactorAuthUtils.verifyToken(payload.secret, payload.token);
    if (isValid) {
      // Simulate updating public.users (is_two_factor_enabled = true, store encrypted secret, backup codes)
      // This would happen inside the Edge Function.
      await supabase
        .from('users')
        .update({
          is_two_factor_enabled: true,
          // two_factor_secret: encrypt(payload.secret) // Pseudocode for encryption
        })
        .eq('id', currentUser.id);

      const backupCodes = twoFactorAuthUtils.generateBackupCodes();
      // Simulate storing encrypted backup codes in DB (also in Edge Function)
      // await supabase.from('users').update({ two_factor_backup_codes: encryptArray(backupCodes) });
      return { success: true, backup_codes: backupCodes };
    } else {
      return { success: false, backup_codes: [] };
    }
  },

  /**
   * Calls an Edge Function to disable 2FA for the user.
   * (Mocked for now)
   */
  async disableTwoFactor(): Promise<Disable2FAResponse> {
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated.');

    // In a real scenario, this would be an Edge Function call:
    // const { data, error } = await supabase.functions.invoke('disable-2fa');
    // if (error) throw error;
    // return data as Disable2FAResponse;

    // Mock implementation:
    console.log_once('userService.disableTwoFactor: Using mocked implementation.');
    // Simulate updating public.users (is_two_factor_enabled = false, clear secret and backup codes)
    // This would happen inside the Edge Function.
    await supabase
      .from('users')
      .update({
        is_two_factor_enabled: false,
        two_factor_secret: null,
        two_factor_backup_codes: null
      })
      .eq('id', currentUser.id);
    return { success: true };
  },

  /**
   * Fetches the user's profile, which includes 2FA status.
   * @param userId The ID of the user.
   * @returns UserProfile or null.
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    // This method is essentially getUserById, but ensuring it returns UserProfile
    // and potentially filters/maps fields if needed for client display.
    return this.getUserById(userId) as Promise<UserProfile | null>;
  },

   /**
   * Calls an Edge Function to regenerate 2FA backup codes.
   * (Mocked for now)
   */
  async regenerateBackupCodes(): Promise<RegenerateBackupCodesResponse> {
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated.');

    // const { data, error } = await supabase.functions.invoke('regenerate-backup-codes');
    // if (error) throw error;
    // return data;

    console.log_once('userService.regenerateBackupCodes: Using mocked implementation.');
    const userProfile = await this.getUserProfile(currentUser.id);
    if (!userProfile?.is_two_factor_enabled) {
        throw new Error('2FA is not enabled for this user.');
    }
    const newBackupCodes = twoFactorAuthUtils.generateBackupCodes();
    // In real scenario, Edge Function would encrypt and save these to DB.
    // await supabase.from('users').update({ two_factor_backup_codes: encryptArray(newBackupCodes) });
    return { success: true, backup_codes: newBackupCodes };
  }
};
