import React from 'react';
import { FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const stats = [
  {
    title: 'إجمالي الفواتير',
    value: '١٢٥',
    icon: FileText,
    color: 'blue'
  },
  {
    title: 'قيد الانتظار',
    value: '١٥',
    icon: Clock,
    color: 'yellow'
  },
  {
    title: 'مدفوعة',
    value: '٩٥',
    icon: CheckCircle,
    color: 'green'
  },
  {
    title: 'متأخرة',
    value: '١٥',
    icon: AlertTriangle,
    color: 'red'
  }
];

export function InvoiceStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div key={stat.title} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
              <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
            </div>
            <div className="mr-4">
              <p className="text-sm text-gray-600">{stat.title}</p>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
