import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export class BaseService {
  protected db: SupabaseClient;
  private retryCount: number = 0;
  private maxRetries: number = 3;
  private isInitialized: boolean = false;

  constructor() {
    this.db = supabase;
    
    // Initialize auth session check
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const { data } = await this.db.auth.getSession();
      if (data.session) {
        console.log('BaseService: Active session found');
        this.isInitialized = true;
      } else {
        console.warn('BaseService: No active session found');
      }
    } catch (error) {
      console.error('BaseService: Error checking session:', error);
    }
  }

  protected async isAuthenticated(): Promise<boolean> {
    try {
      const { data, error } = await this.db.auth.getSession();
      if (error) {
        console.error('Error checking authentication:', error);
        return false;
      }
      return !!data.session;
    } catch (error) {
      console.error('Error in isAuthenticated:', error);
      return false;
    }
  }

  protected async getAuthenticatedUser() {
    const { data: { session } } = await this.db.auth.getSession();
    if (!session) {
      return null;
    }
    
    const { data: { user }, error } = await this.db.auth.getUser();
    if (error || !user) {
      return null;
    }
    
    return user;
  }

  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<T> {
    try {
      // Check authentication first
      const isAuth = await this.isAuthenticated();
      if (!isAuth) {
        // Try refresh token once before failing
        const { data } = await this.db.auth.refreshSession();
        if (!data.session) {
          throw new Error("Authentication required. Please log in.");
        }
      }
      
      const result = await operation();
      this.retryCount = 0; // Reset on success
      return result;
    } catch (error: any) {
      console.error(`${errorMessage}:`, error);

      // Authentication errors
      if (error?.status === 401 || error?.code === '42501' || error?.message?.includes('Authentication')) {
        console.error('Authentication error. Please log in again.');
        return Promise.reject(new Error('يجب تسجيل الدخول لإجراء هذه العملية'));
      }

      if (error?.status === 404) {
        return Promise.reject(new Error('الجدول غير موجود في قاعدة البيانات'));
      }

      if (error?.status === 400) {
        return Promise.reject(new Error('خطأ في صيغة الاستعلام'));
      }

      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`محاولة إعادة الاتصال ${this.retryCount} من ${this.maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
        return this.executeWithRetry(operation, errorMessage);
      }

      if (error?.message?.includes('Failed to fetch') || error?.code === 'NETWORK_ERROR') {
        return Promise.reject(new Error('فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى'));
      }

      return Promise.reject(new Error(errorMessage));
    }
  }

  protected handleError(error: any, message: string): never {
    console.error(`${message}:`, error);
    
    if (error?.status === 401 || error?.code === '42501' || 
        error?.message?.includes('Authentication') || 
        error?.message?.includes('User not authenticated')) {
      console.error('خطأ في المصادقة أو الصلاحيات. يرجى تسجيل الدخول مرة أخرى.');
      throw new Error('يجب تسجيل الدخول لإجراء هذه العملية');
    }

    if (error?.status === 404 || error?.code === '42P01') {
      throw new Error('الجدول غير موجود في قاعدة البيانات');
    }

    if (error?.status === 400) {
      throw new Error('خطأ في صيغة الاستعلام');
    }

    if (error?.message?.includes('Failed to fetch') || error?.code === 'NETWORK_ERROR') {
      throw new Error('فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى');
    }

    throw new Error(message);
  }
}
