import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className = '' }: LogoutButtonProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className={`p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors ${className}`}
      title="تسجيل الخروج"
    >
      <LogOut className="w-5 h-5" />
    </button>
  );
} 