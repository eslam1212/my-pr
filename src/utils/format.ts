import { useSettingsStore } from '@/store/settingsStore';

/**
 * Format a number as currency based on user settings
 */
export function formatCurrency(amount: number): string {
  // Get currency from settings store
  const { currency } = useSettingsStore.getState();
  
  // Map currency code to locale
  const localeMap: Record<string, string> = {
    'SAR': 'ar-SA',
    'USD': 'en-US',
    'EGP': 'ar-EG'
  };
  
  const locale = localeMap[currency] || 'ar-SA';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format a date string according to user settings
 */
export function formatDate(dateString: string): string {
  // Get dateFormat and language from settings store
  const { dateFormat, language } = useSettingsStore.getState();
  
  const date = new Date(dateString);
  
  // Map language to locale
  const localeMap: Record<string, string> = {
    'ar': 'ar-SA',
    'en': 'en-US'
  };
  
  const locale = localeMap[language] || 'ar-SA';
  
  // If using custom format
  if (dateFormat) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    switch (dateFormat) {
      case 'dd/MM/yyyy':
        return `${day}/${month}/${year}`;
      case 'MM/dd/yyyy':
        return `${month}/${day}/${year}`;
      case 'yyyy-MM-dd':
        return `${year}-${month}-${day}`;
      default:
        break;
    }
  }
  
  // Fallback to locale format
  return new Date(dateString).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(num: number): string {
  // Get language from settings store for proper locale
  const { language } = useSettingsStore.getState();
  
  const localeMap: Record<string, string> = {
    'ar': 'ar-SA',
    'en': 'en-US'
  };
  
  const locale = localeMap[language] || 'ar-SA';
  
  return new Intl.NumberFormat(locale).format(num);
}

export const formatPercentage = (value: number): string => {
  // Get language from settings store for proper locale
  const { language } = useSettingsStore.getState();
  
  const localeMap: Record<string, string> = {
    'ar': 'ar-SA',
    'en': 'en-US'
  };
  
  const locale = localeMap[language] || 'ar-SA';
  
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
};
