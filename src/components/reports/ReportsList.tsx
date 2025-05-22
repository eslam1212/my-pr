import React from 'react';
import { FileText, Download } from 'lucide-react';

const reports = [
  {
    id: '1',
    title: 'تقرير المبيعات الشهري',
    description: 'تقرير تفصيلي عن المبيعات خلال الشهر الحالي',
    date: '٢٠٢٤/٠٣/١٥',
    type: 'sales'
  },
  {
    id: '2',
    title: 'تقرير المخزون',
    description: 'تقرير عن حالة المخزون والمنتجات',
    date: '٢٠٢٤/٠٣/١٤',
    type: 'inventory'
  },
  {
    id: '3',
    title: 'تقرير العملاء',
    description: 'تحليل بيانات العملاء والمبيعات',
    date: '٢٠٢٤/٠٣/١٣',
    type: 'customers'
  }
];

export function ReportsList() {
  const handleDownload = (reportId: string) => {
    console.log('Downloading report:', reportId);
  };

  return (
    <div className="bg-white shadow-sm rounded-lg">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">التقارير المتاحة</h2>
      </div>
      <div className="divide-y divide-gray-200">
        {reports.map((report) => (
          <div key={report.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-indigo-100">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="mr-4">
                  <h3 className="text-sm font-medium text-gray-900">{report.title}</h3>
                  <p className="text-sm text-gray-500">{report.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{report.date}</p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(report.id)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Download className="h-4 w-4 ml-1" />
                تحميل
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
