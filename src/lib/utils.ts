import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { useSettingsStore } from '../store/settingsStore';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  // Get dateFormat from settings store
  const { dateFormat, language } = useSettingsStore.getState();
  
  if (typeof date === 'string') {
    date = new Date(date)
  }
  
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
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}
