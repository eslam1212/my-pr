import { supabase } from '../lib/supabase';
import { userService } from './userService'; // To get user profile for 2FA status
import { twoFactorAuthUtils } from '../utils/2fa'; // For mock verification
import { UserProfile } from '../types/database.types'; // Import UserProfile

// Define interfaces for login flow with 2FA
export interface LoginResult {
  session?: any; // Supabase session object
  user?: any; // Supabase user object
  error?: Error | any;
  requires2FA?: boolean;
  userId?: string; // If 2FA is required, pass userId to next step
}

export interface Verify2FAResult {
  session?: any;
  user?: any;
  error?: Error | any;
}

export interface LogoutAllResult {
  success: boolean;
  error?: Error | any;
}

export const authService = {
  // تسجيل الدخول
  async login(email: string, password: string): Promise<LoginResult> {
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Handle common Supabase auth errors like invalid credentials
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('بيانات الدخول غير صحيحة.');
        }
        throw signInError;
      }

      if (!signInData.session || !signInData.user) {
        throw new Error('فشل تسجيل الدخول، لم يتم إرجاع جلسة أو مستخدم.');
      }
      
      // Check if 2FA is enabled for this user
      const userProfile: UserProfile | null = await userService.getUserProfile(signInData.user.id);

      if (userProfile && userProfile.is_two_factor_enabled) {
        // User has 2FA enabled. Do not return session yet.
        // Indicate that 2FA is required.
        // Clear the session from client-side storage as it's not fully authenticated.
        // Supabase client might auto-store it, so we sign out locally to ensure
        // the user is forced to complete 2FA.
        // This is a tricky part with Supabase's client behavior.
        // A more robust way might involve custom JWTs or server-side session management
        // if Supabase's default session handling interferes with the 2FA step.
        // For now, we'll assume the UI will handle prompting for 2FA.
        // We are NOT calling await supabase.auth.signOut() here as that would invalidate the MFA state server-side.
        // Instead, the UI should simply not store the session as "fully logged in".
        
        console.log(`User ${signInData.user.id} has 2FA enabled. Token required.`);
        return { 
          requires2FA: true, 
          userId: signInData.user.id, // Pass userId for the 2FA verification step
          // We don't return the session/user yet to prevent premature access
        };
      }

      // 2FA is not enabled, proceed as normal
      return { session: signInData.session, user: signInData.user };

    } catch (error: any) {
      console.error('Error logging in:', error);
      // Ensure error is of type Error for consistent handling
      const err = error instanceof Error ? error : new Error(String(error.message || 'فشل تسجيل الدخول'));
      return { error: err };
    }
  },

  /**
   * Verifies the 2FA token (TOTP or backup code) after primary login.
   * (Mocked for now - would call a 'verify-2fa-login' Edge Function)
   * @param userId The user's ID.
   * @param token The 2FA token or backup code.
   */
  async verifyTwoFactorLoginToken(userId: string, token: string): Promise<Verify2FAResult> {
    try {
      // In a real scenario, this would be an Edge Function call:
      // const { data, error } = await supabase.functions.invoke('verify-2fa-login', { body: { userId, token } });
      // if (error) throw error;
      // If successful, the Edge Function would have validated the token and should return
      // the full session information, possibly by re-signing or confirming the MFA.
      // For Supabase, this might involve the Edge Function using the admin client to issue a new token
      // or confirm the existing partial session after MFA success.
      // return { session: data.session, user: data.user };

      // Mock implementation:
      console.log_once('authService.verifyTwoFactorLoginToken: Using mocked implementation.');
      const userProfile = await userService.getUserProfile(userId);
      if (!userProfile || !userProfile.is_two_factor_enabled) {
        throw new Error('2FA not enabled or user profile not found.');
      }
      
      // The actual encrypted secret is not available client-side.
      // This mock assumes we'd need to fetch it (which we can't securely do client-side).
      // An Edge function would fetch the *encrypted* secret from DB, decrypt it, then verify.
      // For mock, we'll re-generate a secret for the user's email to simulate verification,
      // assuming the one provided during setup matches this. This is highly insecure for real use.
      // THIS IS A VERY ROUGH MOCK FOR THE VERIFICATION LOGIC.
      const tempSecretInfo = twoFactorAuthUtils.generateSecret(userProfile.email!); // Requires email in profile
      const isValidToken = twoFactorAuthUtils.verifyToken(tempSecretInfo.base32, token);
      
      let isValidBackupCode = false;
      if (!isValidToken) {
          // TODO: Fetch (mocked) backup codes and verify.
          // For now, assume backup code verification is also part of the Edge Function.
          // const storedBackupCodes = await userService.getUsersBackupCodes(userId); // This method doesn't exist
          // isValidBackupCode = twoFactorAuthUtils.verifyBackupCode(token, storedBackupCodes);
          // if (isValidBackupCode) { /* Invalidate the code in DB via Edge Function */ }
          console.warn('Backup code verification not fully mocked yet.');
      }

      if (isValidToken || isValidBackupCode) {
        // If token is valid, the user is now fully authenticated.
        // We need to get the session that was partially established or re-establish it.
        // Supabase client should have handled the session after initial signInWithPassword.
        // We might need to call getSession() again to ensure it's the latest.
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          throw sessionError || new Error('No active session after 2FA verification.');
        }
        // It's possible Supabase handles MFA state internally and the session is now fully valid.
        // Or, the Edge Function might return a new JWT.
        return { session: sessionData.session, user: sessionData.session.user };
      } else {
        throw new Error('رمز المصادقة الثنائية غير صحيح.');
      }
    } catch (error: any) {
      console.error('Error verifying 2FA token:', error);
      const err = error instanceof Error ? error : new Error(String(error.message || 'فشل التحقق من رمز المصادقة الثنائية.'));
      return { error: err };
    }
  },

  // تسجيل الخروج
  async logout() { // This is local sign out
    try {
      const { error } = await supabase.auth.signOut(); // Default scope is 'local'
      if (error) throw error;
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  },

  /**
   * Calls an Edge Function to sign the user out from all devices.
   * (Mocked for now)
   */
  async logoutFromAllWindows(): Promise<LogoutAllResult> {
    // In a real scenario, this would be an Edge Function call:
    // const { data, error } = await supabase.functions.invoke('logout-all-sessions');
    // if (error) return { success: false, error };
    // return { success: data.success };

    // Mock implementation:
    console.log_once('authService.logoutFromAllWindows: Using mocked implementation.');
    // To simulate, we can try a global signout on the client, though its effect might be limited
    // without the service_role typically used in an Edge Function for this.
    try {
      // supabase.auth.signOut({ scope: 'global' }) attempts to revoke all refresh tokens.
      // This is the closest client-side equivalent to a global logout.
      // An Edge Function using admin.signOutUser(userId) would be more robust.
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        console.error('Error during client-side global signOut:', error);
        return { success: false, error };
      }
      // After this, the current session is invalidated. The user will be redirected
      // by onAuthStateChange or similar logic in AuthContext.
      return { success: true };
    } catch (error: any) {
      console.error('Error in mocked logoutFromAllWindows:', error);
      return { success: false, error };
    }
  },

  // جلب بيانات المستخدم الحالي
  async getCurrentUser() {
    try {
      // التحقق من وجود جلسة صالحة
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error('No active session found');
      }

      // جلب بيانات المستخدم
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  },
};
