import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import { Logo } from './Logo';
import { menuItems } from './SidebarMenu';
import { BackupModal } from '../backup/BackupModal';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const MenuItem = ({ item, isActive }: { 
    item: { path: string; label: string; icon: React.ElementType };
    isActive: boolean;
  }) => (
    <button
      onClick={() => {
        if (item.path === '/backup') {
          setIsBackupModalOpen(true);
        } else {
          navigate(item.path);
          if (window.innerWidth < 1024) {
            onToggle();
          }
        }
      }}
      className={`
        group flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200
        ${isActive 
          ? 'bg-indigo-600 text-white' 
          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}
      `}
    >
      <item.icon className={`w-5 h-5 ${collapsed ? 'mx-auto' : 'mr-3'} transition-transform group-hover:scale-110`} />
      {!collapsed && (
        <span className="font-medium transition-colors">
          {item.label}
        </span>
      )}
      {collapsed && (
        <div className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 shadow-lg z-50">
          {item.label}
        </div>
      )}
    </button>
  );

  return (
    <>
      <div 
        className={`
          fixed inset-0 bg-black bg-opacity-50 transition-opacity lg:hidden z-20
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onToggle}
      />

      {/* Mobile Menu Toggle Button */}
      <button
        onClick={onToggle}
        className={`
          fixed top-4 right-4 p-2 rounded-md bg-gray-800 text-white hover:bg-gray-700
          transition-all duration-300 lg:hidden z-30
          ${isOpen ? 'translate-x-0 opacity-0' : 'translate-x-0 opacity-100'}
        `}
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <aside className={`
        fixed lg:sticky top-0 right-0 h-full bg-gray-900 text-white transition-all duration-300 z-30
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        ${collapsed ? 'w-20' : 'w-64'}
      `}>
        <div className="relative h-full flex flex-col">
          <div className="flex items-center justify-between p-4 lg:p-0">
            <Logo collapsed={collapsed} />
            <button
              onClick={onToggle}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute left-0 top-6 p-2 bg-gray-800 rounded-r-lg hover:bg-gray-700 hidden lg:block"
          >
            {collapsed ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>

          <nav className="flex-1 flex flex-col px-3 py-4 overflow-y-auto">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <MenuItem 
                  key={item.path} 
                  item={item} 
                  isActive={location.pathname === item.path}
                />
              ))}
            </div>
          </nav>
        </div>
      </aside>

      <BackupModal 
        isOpen={isBackupModalOpen} 
        onClose={() => setIsBackupModalOpen(false)} 
      />
    </>
  );
}
