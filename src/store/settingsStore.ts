import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { saveUserSettings, getUserSettings } from '../lib/api';
import { supabase } from '../lib/supabase';

interface SettingsState {
  direction: 'rtl' | 'ltr';
  language: 'ar' | 'en';
  theme: 'light' | 'dark' | 'system';
  currency: 'SAR' | 'USD' | 'EGP';
  dateFormat: 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';
  userId: string | null;
  isLoading: boolean;
  setDirection: (direction: 'rtl' | 'ltr') => void;
  setLanguage: (language: 'ar' | 'en') => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setCurrency: (currency: 'SAR' | 'USD' | 'EGP') => void;
  setDateFormat: (format: 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd') => void;
  setUserId: (id: string | null) => void;
  syncSettings: () => Promise<void>;
  applySettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      direction: 'rtl',
      language: 'ar',
      theme: 'system',
      currency: 'SAR',
      dateFormat: 'dd/MM/yyyy',
      userId: null,
      isLoading: false,
      
      setDirection: (direction) => {
        set({ direction });
        document.documentElement.dir = direction;
        document.body.classList.toggle('rtl', direction === 'rtl');
      },
      
      setLanguage: (language) => {
        set({ language });
        document.documentElement.lang = language;
      },
      
      setTheme: (theme) => {
        set({ theme });
        
        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          document.documentElement.classList.toggle('dark', systemTheme === 'dark');
        } else {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
      },
      
      setCurrency: (currency) => set({ currency }),
      
      setDateFormat: (format) => set({ dateFormat: format }),
      
      setUserId: (id) => set({ userId: id }),
      
      syncSettings: async () => {
        const state = get();
        const { userId } = state;
        
        if (!userId) return;
        
        try {
          set({ isLoading: true });
          
          // Save settings to database
          const result = await saveUserSettings(userId, {
            direction: state.direction,
            language: state.language,
            theme: state.theme,
            currency: state.currency,
            dateFormat: state.dateFormat
          });
          
          // If result is null, the table probably doesn't exist yet, which is okay
          if (result === null) {
            console.warn('User settings table may not exist yet. Using local settings only.');
          }
        } catch (error) {
          console.error('Error syncing settings:', error);
          // Continue with local settings even if DB fails
        } finally {
          set({ isLoading: false });
        }
      },
      
      applySettings: () => {
        const { direction, language, theme } = get();
        
        // Apply direction
        document.documentElement.dir = direction;
        document.body.classList.toggle('rtl', direction === 'rtl');
        
        // Apply language
        document.documentElement.lang = language;
        
        // Apply theme
        if (theme === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          document.documentElement.classList.toggle('dark', systemTheme === 'dark');
        } else {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
        
        // Listen for system theme changes if using system theme
        if (theme === 'system') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleChange = (e: MediaQueryListEvent) => {
            document.documentElement.classList.toggle('dark', e.matches);
          };
          
          mediaQuery.addEventListener('change', handleChange);
          return () => mediaQuery.removeEventListener('change', handleChange);
        }
      }
    }),
    {
      name: 'user-settings',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Apply settings on page load
        if (state) {
          state.applySettings();
          
          // Check for current user and load their settings from DB if available
          supabase.auth.getSession().then(({ data }) => {
            const userId = data.session?.user.id;
            if (userId) {
              state.setUserId(userId);
              
              getUserSettings(userId).then(settings => {
                if (settings) {
                  // Update local settings with DB settings
                  if (settings.direction) state.setDirection(settings.direction);
                  if (settings.language) state.setLanguage(settings.language);
                  if (settings.theme) state.setTheme(settings.theme);
                  if (settings.currency) state.setCurrency(settings.currency);
                  if (settings.dateFormat) state.setDateFormat(settings.dateFormat);
                }
              }).catch(err => {
                // Just log error and continue with default settings
                console.error('Error loading user settings:', err);
              });
            }
          }).catch(err => {
            // Just log error and continue with default settings
            console.error('Error getting user session:', err);
          });
        }
      }
    }
  )
);

// Initialize settings on app load
useSettingsStore.getState().applySettings();
