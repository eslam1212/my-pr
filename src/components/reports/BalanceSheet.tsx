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

interface BalanceSheetProps {
  data: any[];
  isLoading: boolean;
}

export function BalanceSheet({ data, isLoading }: BalanceSheetProps) {
  const assets = data.filter(account => account.type === 'asset');
  const liabilities = data.filter(account => account.type === 'liability');
  const equity = data.filter(account => account.type === 'equity');

  const totalAssets = assets.reduce((sum, account) => sum + (account.balance || 0), 0);
  const totalLiabilities = liabilities.reduce((sum, account) => sum + (account.balance || 0), 0);
  const totalEquity = equity.reduce((sum, account) => sum + (account.balance || 0), 0);

  const handleExport = () => {
    const csv = [
      ['نوع الحساب', 'اسم الحساب', 'الرصيد'],
      ...assets.map(account => ['أصول', account.name, account.balance]),
      ...liabilities.map(account => ['التزامات', account.name, account.balance]),
      ...equity.map(account => ['حقوق الملكية', account.name, account.balance]),
      [],
      ['إجمالي الأصول', '', totalAssets],
      ['إجمالي الالتزامات', '', totalLiabilities],
      ['إجمالي حقوق الملكية', '', totalEquity]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'balance_sheet.csv';
    link.click();
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">إجمالي الأصول</h3>
            <p className="text-2xl font-bold">{formatCurrency(totalAssets)}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">إجمالي الالتزامات</h3>
            <p className="text-2xl font-bold">{formatCurrency(totalLiabilities)}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">إجمالي حقوق الملكية</h3>
            <p className="text-2xl font-bold">{formatCurrency(totalEquity)}</p>
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
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">الأصول</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الحساب</TableHead>
                  <TableHead>الرصيد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>{formatCurrency(account.balance)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-semibold">
                  <TableCell>إجمالي الأصول</TableCell>
                  <TableCell>{formatCurrency(totalAssets)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>

          <Card>
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">الالتزامات</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الحساب</TableHead>
                  <TableHead>الرصيد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liabilities.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>{formatCurrency(account.balance)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-semibold">
                  <TableCell>إجمالي الالتزامات</TableCell>
                  <TableCell>{formatCurrency(totalLiabilities)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>

          <Card>
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">حقوق الملكية</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الحساب</TableHead>
                  <TableHead>الرصيد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equity.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>{formatCurrency(account.balance)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-semibold">
                  <TableCell>إجمالي حقوق الملكية</TableCell>
                  <TableCell>{formatCurrency(totalEquity)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>

          <Card className="bg-gray-50">
            <Table>
              <TableBody>
                <TableRow className="font-bold text-lg">
                  <TableCell>إجمالي الالتزامات وحقوق الملكية</TableCell>
                  <TableCell>{formatCurrency(totalLiabilities + totalEquity)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}
