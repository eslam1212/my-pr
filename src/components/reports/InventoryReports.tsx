import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from '@/lib/utils';

interface InventoryReportsProps {
  data: any[];
  isLoading: boolean;
}

export function InventoryReports({ data, isLoading }: InventoryReportsProps) {
  const totalStock = data.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalValue = data.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
  const lowStockItems = data.filter(item => (item.quantity || 0) <= (item.min_quantity || 5)).length;

  const handleExport = () => {
    const csv = [
      ['المنتج', 'التصنيف', 'المورد', 'الكمية', 'السعر', 'القيمة الإجمالية'],
      ...data.map(item => [
        item.name,
        item.category?.name || '',
        item.supplier?.name || '',
        item.quantity,
        item.price,
        (item.quantity || 0) * (item.price || 0)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'inventory_report.csv';
    link.click();
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">إجمالي المخزون</h3>
            <p className="text-2xl font-bold">{totalStock} قطعة</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">القيمة الإجمالية</h3>
            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">منتجات منخفضة المخزون</h3>
            <p className="text-2xl font-bold">{lowStockItems}</p>
          </Card>
        </div>

        <Button variant="outline" className="flex items-center gap-2" onClick={handleExport}>
          <Download className="h-4 w-4" />
          تصدير
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المنتج</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>المورد</TableHead>
                <TableHead>الكمية</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>القيمة الإجمالية</TableHead>
                <TableHead>الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => {
                const totalItemValue = (item.quantity || 0) * (item.price || 0);
                const isLowStock = (item.quantity || 0) <= (item.min_quantity || 5);
                
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category?.name}</TableCell>
                    <TableCell>{item.supplier?.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.price)}</TableCell>
                    <TableCell>{formatCurrency(totalItemValue)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        isLowStock 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {isLowStock ? 'مخزون منخفض' : 'متوفر'}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    لا توجد بيانات للعرض
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
