import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChevronDown } from 'lucide-react';

// بيانات المخطط البياني
const data = [
  { name: 'Jan', sales: 4000, expenses: 2400 },
  { name: 'Feb', sales: 3000, expenses: 1398 },
  { name: 'Mar', sales: 2000, expenses: 9800 },
  { name: 'Apr', sales: 2780, expenses: 3908 },
  { name: 'May', sales: 1890, expenses: 4800 },
  { name: 'Jun', sales: 2390, expenses: 3800 },
  { name: 'Jul', sales: 3490, expenses: 4300 },
  { name: 'Aug', sales: 3000, expenses: 2000 },
  { name: 'Sep', sales: 2000, expenses: 1000 },
  { name: 'Oct', sales: 2780, expenses: 3000 },
  { name: 'Nov', sales: 1890, expenses: 2000 },
  { name: 'Dec', sales: 2390, expenses: 1000 },
];

const timeRanges = ['سنوي', 'شهري', 'أسبوعي', 'يومي'];

export function DashboardCharts() {
  const [selectedRange, setSelectedRange] = useState('شهري');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header with Dropdown */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg font-medium text-gray-900">
          تحليل الأداء العام
        </h2>
        
        {/* Time Range Dropdown */}
        <div className="relative w-full sm:w-auto">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex justify-between items-center"
          >
            <span>{selectedRange}</span>
            <ChevronDown className="ml-2 h-4 w-4" />
          </button>

          {isDropdownOpen && (
            <div className="absolute left-0 mt-2 w-full sm:w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
              {timeRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setSelectedRange(range);
                    setIsDropdownOpen(false);
                  }}
                  className="block w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                >
                  {range}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chart Container */}
      <div className="w-full" style={{ minHeight: '300px' }}>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 5,
              left: 5,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              fontSize={12}
              tickMargin={10}
              stroke="#6b7280"
            />
            <YAxis
              fontSize={12}
              tickMargin={10}
              stroke="#6b7280"
              tickFormatter={(value) => `${value.toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '0.5rem',
              }}
              labelStyle={{ color: '#374151', marginBottom: '0.25rem' }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => (value === 'sales' ? 'المبيعات' : 'المصروفات')}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="المبيعات"
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#82ca9d"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="المصروفات"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Mobile Stats Summary */}
      <div className="block sm:hidden mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-sm text-purple-600">إجمالي المبيعات</p>
            <p className="text-lg font-semibold text-purple-900">
              {data.reduce((sum, item) => sum + item.sales, 0).toLocaleString()} ريال
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-sm text-green-600">إجمالي المصروفات</p>
            <p className="text-lg font-semibold text-green-900">
              {data.reduce((sum, item) => sum + item.expenses, 0).toLocaleString()} ريال
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
