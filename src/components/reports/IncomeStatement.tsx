import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Filter } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { formatCurrency } from '@/lib/utils';

interface IncomeStatementProps {
  data: any[];
  isLoading: boolean;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
}

export function IncomeStatement({ data, isLoading, onDateRangeChange }: IncomeStatementProps) {
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

  const revenues = data.filter(transaction => transaction.account?.type === 'revenue');
  const expenses = data.filter(transaction => transaction.account?.type === 'expense');

  const totalRevenue = revenues.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
  const totalExpenses = expenses.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
  const netIncome = totalRevenue - totalExpenses;

  const handleExport = () => {
    const csv = [
      ['نوع الحساب', 'الحساب', 'المبلغ'],
      ['إيرادات', '', ''],
      ...revenues.map(transaction => ['', transaction.account?.name || '', transaction.amount]),
      ['إجمالي الإيرادات', '', totalRevenue],
      ['', '', ''],
      ['مصروفات', '', ''],
      ...expenses.map(transaction => ['', transaction.account?.name || '', transaction.amount]),
      ['إجمالي المصروفات', '', totalExpenses],
      ['', '', ''],
      ['صافي الدخل', '', netIncome]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'income_statement.csv';
    link.click();
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">إجمالي الإيرادات</h3>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">إجمالي المصروفات</h3>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">صافي الدخل</h3>
            <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netIncome)}
            </p>
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
            <SheetContent side="left" className="rtl">
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
                  dir="rtl"
                />
              </div>
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
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">الإيرادات</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الحساب</TableHead>
                  <TableHead>المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenues.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.account?.name}</TableCell>
                    <TableCell className="text-green-600">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-semibold">
                  <TableCell>إجمالي الإيرادات</TableCell>
                  <TableCell className="text-green-600">{formatCurrency(totalRevenue)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>

          <Card>
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">المصروفات</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الحساب</TableHead>
                  <TableHead>المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">{transaction.account?.name}</TableCell>
                    <TableCell className="text-red-600">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-semibold">
                  <TableCell>إجمالي المصروفات</TableCell>
                  <TableCell className="text-red-600">{formatCurrency(totalExpenses)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>

          <Card className="bg-gray-50">
            <Table>
              <TableBody>
                <TableRow className="font-bold text-lg">
                  <TableCell>صافي الدخل</TableCell>
                  <TableCell className={netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(netIncome)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}
