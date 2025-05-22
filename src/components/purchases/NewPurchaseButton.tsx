import React from 'react';
import { Plus } from 'lucide-react';

interface NewPurchaseButtonProps {
  onClick: () => void;
}

export function NewPurchaseButton({ onClick }: NewPurchaseButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      <Plus className="h-4 w-4 ml-2" />
      إضافة فاتورة مشتريات جديدة
    </button>
  );
}
