import React from 'react';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CashFlowProps {
  dateRange?: DateRange;
}

const operatingActivities = [
  { name: 'صافي الدخل', amount: 500000 },
  { name: 'الاستهلاك والإطفاء', amount: 50000 },
  { name: 'التغير في الذمم المدينة', amount: -75000 },
  { name: 'التغير في المخزون', amount: -100000 },
  { name: 'التغير في الذمم الدائنة', amount: 80000 },
];

const investingActivities = [
  { name: 'شراء أصول ثابتة', amount: -200000 },
  { name: 'استثمارات جديدة', amount: -150000 },
  { name: 'بيع أصول', amount: 75000 },
];

const financingActivities = [
  { name: 'إصدار أسهم', amount: 300000 },
  { name: 'توزيعات أرباح', amount: -100000 },
  { name: 'سداد قروض', amount: -150000 },
];

const monthlyData = [
  { month: 'يناير', operating: 50000, investing: -20000, financing: 10000, netCash: 40000 },
  { month: 'فبراير', operating: 55000, investing: -25000, financing: 15000, netCash: 45000 },
  { month: 'مارس', operating: 60000, investing: -30000, financing: 20000, netCash: 50000 },
  { month: 'أبريل', operating: 65000, investing: -35000, financing: 25000, netCash: 55000 },
  { month: 'مايو', operating: 70000, investing: -40000, financing: 30000, netCash: 60000 },
  { month: 'يونيو', operating: 75000, investing: -45000, financing: 35000, netCash: 65000 },
];

export const CashFlow: React.FC<CashFlowProps> = ({ dateRange }) => {
  const totalOperating = operatingActivities.reduce((sum, item) => sum + item.amount, 0);
  const totalInvesting = investingActivities.reduce((sum, item) => sum + item.amount, 0);
  const totalFinancing = financingActivities.reduce((sum, item) => sum + item.amount, 0);
  const netCashFlow = totalOperating + totalInvesting + totalFinancing;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>الأنشطة التشغيلية</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>البند</TableHead>
                  <TableHead className="text-left">المبلغ (ر.س)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operatingActivities.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-left">{item.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell>صافي النقد من الأنشطة التشغيلية</TableCell>
                  <TableCell className="text-left">{totalOperating.toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الأنشطة الاستثمارية</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>البند</TableHead>
                  <TableHead className="text-left">المبلغ (ر.س)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investingActivities.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-left">{item.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell>صافي النقد من الأنشطة الاستثمارية</TableCell>
                  <TableCell className="text-left">{totalInvesting.toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>الأنشطة التمويلية</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>البند</TableHead>
                  <TableHead className="text-left">المبلغ (ر.س)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financingActivities.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell className="text-left">{item.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell>صافي النقد من الأنشطة التمويلية</TableCell>
                  <TableCell className="text-left">{totalFinancing.toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>تحليل التدفقات النقدية الشهرية</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="operating" stroke="#8884d8" name="التشغيلية" />
              <Line type="monotone" dataKey="investing" stroke="#82ca9d" name="الاستثمارية" />
              <Line type="monotone" dataKey="financing" stroke="#ffc658" name="التمويلية" />
              <Line type="monotone" dataKey="netCash" stroke="#ff7300" name="صافي النقد" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ملخص التدفقات النقدية</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow className="font-bold">
                <TableCell>صافي النقد من الأنشطة التشغيلية</TableCell>
                <TableCell className="text-left">{totalOperating.toLocaleString()} ر.س</TableCell>
              </TableRow>
              <TableRow className="font-bold">
                <TableCell>صافي النقد من الأنشطة الاستثمارية</TableCell>
                <TableCell className="text-left">{totalInvesting.toLocaleString()} ر.س</TableCell>
              </TableRow>
              <TableRow className="font-bold">
                <TableCell>صافي النقد من الأنشطة التمويلية</TableCell>
                <TableCell className="text-left">{totalFinancing.toLocaleString()} ر.س</TableCell>
              </TableRow>
              <TableRow className="font-bold">
                <TableCell>صافي التغير في النقد</TableCell>
                <TableCell className="text-left">{netCashFlow.toLocaleString()} ر.س</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
