import React from 'react';
import { TrendingUp, DollarSign, Users, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stats = [
  {
    title: 'إجمالي المبيعات',
    value: '١٢٥,٠٠٠ ريال',
    change: '+١٥٪',
    icon: DollarSign,
    color: 'blue'
  },
  {
    title: 'عدد العملاء',
    value: '٤٥',
    change: '+٨٪',
    icon: Users,
    color: 'green'
  },
  {
    title: 'المنتجات المباعة',
    value: '٣٢٠',
    change: '+١٢٪',
    icon: Package,
    color: 'purple'
  },
  {
    title: 'متوسط قيمة الطلب',
    value: '٢,٧٨٠ ريال',
    change: '+٥٪',
    icon: TrendingUp,
    color: 'indigo'
  }
];

export function ReportsStats() {
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
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <span className="mr-2 text-sm font-medium text-green-600">{stat.change}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export const ReportsStatsCard: React.FC = () => {
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            إجمالي المبيعات
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">45,231.89 ر.س</div>
          <p className="text-xs text-muted-foreground">
            +20.1% من الشهر الماضي
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            المخزون
          </CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1,234</div>
          <p className="text-xs text-muted-foreground">
            +180 منتج جديد
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            العملاء النشطون
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">573</div>
          <p className="text-xs text-muted-foreground">
            +201 عميل جديد
          </p>
        </CardContent>
      </Card>
    </>
  );
};
