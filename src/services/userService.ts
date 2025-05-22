import { supabase } from '../lib/supabase';
import { UserFormData } from '../types/auth';

export const userService = {
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
      });

      if (authError) throw authError;

      // إضافة المستخدم إلى جدول users
      const { data, error } = await supabase
        .from('users')
        .insert([{ ...user, id: authData.user?.id }])
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('فشل في إنشاء المستخدم');
    }
  },

  // تحديث مستخدم موجود
  async updateUser(userId: string, updatedUser: Partial<UserFormData>) {
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
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('فشل في حذف المستخدم');
    }
  },
};
