import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Filter, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from '@/lib/utils';
import { PageWrapper } from '../layout/PageWrapper';

interface SalesReportsProps {
  data: any[];
  isLoading: boolean;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
}

export function SalesReports({ data, isLoading, onDateRangeChange }: SalesReportsProps) {
  const [date, setDate] = useState<DateRange | undefined>();

  const handleDateSelect = (newDate: DateRange | undefined) => {
    setDate(newDate);
    if (newDate?.from && newDate?.to && onDateRangeChange) {
      onDateRangeChange(
        newDate.from.toISOString(),
        newDate.to.toISOString()
      );
    }
  };

  const totalSales = data.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const averageSale = data.length > 0 ? totalSales / data.length : 0;
  const totalItems = data.reduce((sum, sale) => 
    sum + (sale.items?.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0) || 0)
  , 0);

  const handleExport = () => {
    const csv = [
      ['رقم الفاتورة', 'العميل', 'التاريخ', 'المجموع', 'عدد المنتجات'],
      ...data.map(sale => [
        sale.invoice_number,
        sale.customer?.name || '',
        formatDate(sale.created_at),
        sale.total,
        sale.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales_report_${formatDate(new Date())}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">إجمالي المبيعات</h3>
            <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">متوسط قيمة الفاتورة</h3>
            <p className="text-2xl font-bold">{formatCurrency(averageSale)}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">إجمالي المنتجات المباعة</h3>
            <p className="text-2xl font-bold">{totalItems}</p>
          </Card>
        </div>

        <div className="flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                تصفية
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <PageWrapper>
                <SheetHeader>
                  <SheetTitle>تصفية التقرير</SheetTitle>
                  <SheetDescription>
                    حدد الفترة الزمنية للتقرير
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                  <Calendar
                    mode="range"
                    selected={date}
                    onSelect={handleDateSelect}
                    className="rounded-md border"
                    lang="ar"
                  />
                </div>
              </PageWrapper>
            </SheetContent>
          </Sheet>

          <Button variant="outline" className="flex items-center gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            تصدير
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="text-lg font-medium">تقرير المبيعات</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الفاتورة</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>عدد المنتجات</TableHead>
                  <TableHead>المجموع</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">لا توجد بيانات متاحة</TableCell>
                  </TableRow>
                ) : (
                  data.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.invoice_number}</TableCell>
                      <TableCell>{sale.customer?.name || '-'}</TableCell>
                      <TableCell>{formatDate(sale.created_at)}</TableCell>
                      <TableCell>{sale.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0}</TableCell>
                      <TableCell>{formatCurrency(sale.total)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
