import React from 'react';
import { useSettingsStore } from '../../store/settingsStore';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageWrapper component to apply global settings like direction to page content
 * Use this component to wrap page content to ensure consistent application of settings
 */
export function PageWrapper({ children, className = '' }: PageWrapperProps) {
  const { direction } = useSettingsStore();
  
  return (
    <div dir={direction} className={className}>
      {children}
    </div>
  );
} 