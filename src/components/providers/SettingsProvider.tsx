import React, { useEffect } from 'react';
import { useSettingsStore } from '../../store/settingsStore';

interface SettingsProviderProps {
  children: React.ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { direction, language, theme, currency, dateFormat, applySettings } = useSettingsStore();

  useEffect(() => {
    // Apply all settings when component mounts
    applySettings();
    
    // Apply direction and language
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
    document.body.classList.toggle('rtl', direction === 'rtl');

    // Apply theme
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', systemTheme === 'dark');
    } else {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [direction, language, theme, currency, dateFormat, applySettings]);

  return <>{children}</>;
}
