import { UserRole } from '../types/auth';

const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    'users.manage',
    'customers.manage',
    'suppliers.manage',
    'products.manage',
    'invoices.manage',
    'reports.view',
    'settings.manage'
  ],
  accountant: [
    'customers.view',
    'customers.manage',
    'suppliers.view',
    'suppliers.manage',
    'invoices.manage',
    'reports.view'
  ],
  viewer: [
    'customers.view',
    'suppliers.view',
    'invoices.view',
    'reports.view'
  ]
};

export const hasPermission = (userRole: UserRole, permission: string): boolean => {
  return rolePermissions[userRole]?.includes(permission) ?? false;
};

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};
