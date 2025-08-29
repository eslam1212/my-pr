import React from 'react';
import { Bell, User, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { LogoutButton } from '../auth/LogoutButton';
import { useSettingsStore } from '../../store/settingsStore';

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Header({ isSidebarOpen, onToggleSidebar }: HeaderProps) {
  const { user } = useAuth();
  const { direction } = useSettingsStore();

  return (
    <header className="bg-white shadow-sm" dir={direction}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button 
              onClick={onToggleSidebar}
              className="p-2 rounded-md text-gray-600 lg:hidden hover:bg-slate-100 mr-2"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 md:mr-0">لوحة التحكم</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-slate-100 relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 transform translate-x-1/2 -translate-y-1/2"></span>
            </button>
            
            <div className="flex items-center space-x-2">
              <div className="text-right ml-2 hidden sm:block">
                <p className="text-sm font-medium text-gray-700">{user?.username}</p>
                <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'مدير النظام' : user?.role === 'accountant' ? 'محاسب' : 'مستخدم'}</p>
              </div>
              <button className="p-2 rounded-full hover:bg-slate-100">
                <User className="w-5 h-5 text-gray-600" />
              </button>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
