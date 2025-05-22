import React from 'react';

export function Logo({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="w-12 h-12 mx-auto">
        <img 
          src="https://via.placeholder.com/48/2563eb/ffffff?text=N" 
          alt="Nex Logo"
          className="rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 text-center">
      <h1 className="text-2xl font-bold text-white mb-1">نظام المحاسبة</h1>
      <p className="text-sm text-gray-400">Nex Accounting</p>
    </div>
  );
}
