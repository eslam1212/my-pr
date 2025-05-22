import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useInventoryAlerts } from '../../hooks/useInventoryAlerts';

export function InventoryAlerts() {
  const alerts = useInventoryAlerts();

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center mb-4">
        <AlertTriangle className="h-5 w-5 text-yellow-600 ml-2" />
        <h2 className="text-lg font-medium text-yellow-800">تنبيهات المخزون</h2>
      </div>
      <ul className="space-y-2">
        {alerts.map((alert, index) => (
          <li key={index} className="flex items-center text-yellow-700">
            <span className="ml-2">•</span>
            <span>{alert.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
