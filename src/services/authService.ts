import { supabase } from '../lib/supabase';

export const authService = {
  // تسجيل الدخول
  async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  // تسجيل الخروج
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
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
