import React, { useState, useMemo } from 'react';
import { formatCurrency, formatDate } from '../../utils/format';
import { Search, Edit, Trash2, Plus, CheckCircle, Clock, AlertTriangle, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const mockMaintenance = [
  { id: 1, asset: 'لابتوب HP', date: '2024-03-15', description: 'تغيير شاشة', cost: 500, status: 'completed', technician: 'أحمد' },
  { id: 2, asset: 'طابعة Canon', date: '2024-03-10', description: 'صيانة دورية', cost: 200, status: 'pending', technician: 'سارة' },
  { id: 3, asset: 'سيارة نقل', date: '2024-03-05', description: 'تغيير زيت', cost: 300, status: 'completed', technician: 'أحمد' },
  { id: 4, asset: 'أثاث مكتبي', date: '2024-02-28', description: 'صيانة الكراسي', cost: 100, status: 'canceled', technician: 'سارة' },
  { id: 5, asset: 'مكيف مركزي', date: '2024-02-20', description: 'تنظيف الفلاتر', cost: 150, status: 'completed', technician: 'محمد' },
];

const maintenanceSchema = z.object({
  asset: z.string().min(3, 'اسم الأصل يجب أن يكون 3 أحرف على الأقل'),
  date: z.string().min(1, 'تاريخ الصيانة مطلوب'),
  description: z.string().optional(),
  cost: z.number().min(0, 'تكلفة الصيانة يجب أن تكون أكبر من أو تساوي صفر'),
  status: z.enum(['pending', 'completed', 'canceled'] as const, {
    required_error: 'حالة الصيانة مطلوبة'
  }),
  technician: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

export function MaintenanceManager() {
  const [maintenanceRecords, setMaintenanceRecords] = useState(mockMaintenance);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<any>(null);
  const [technicians, setTechnicians] = useState(['أحمد', 'سارة', 'محمد']);
  const [newTechnician, setNewTechnician] = useState('');

  const filteredMaintenance = useMemo(() => {
    return maintenanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && end && (recordDate < start || recordDate > end)) {
        return false;
      } else if (start && recordDate < start) {
        return false;
      } else if (end && recordDate > end) {
        return false;
      }

      if (selectedStatus && record.status !== selectedStatus) {
        return false;
      }

      if (selectedTechnician && record.technician !== selectedTechnician) {
        return false;
      }

      return record.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.description?.toLowerCase().includes(searchTerm.toLowerCase())
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [maintenanceRecords, searchTerm, selectedStatus, selectedTechnician, startDate, endDate]);

  const handleAddTechnician = () => {
    if (newTechnician && !technicians.includes(newTechnician)) {
      setTechnicians([...technicians, newTechnician]);
      setNewTechnician('');
    }
  };

  const handleEditMaintenance = (record: any) => {
    setEditingMaintenance(record);
    setIsFormOpen(true);
  };

  const handleDeleteMaintenance = (id: number) => {
    setMaintenanceRecords(maintenanceRecords.filter(record => record.id !== id));
  };

  const handleAddMaintenance = (newRecord: any) => {
    setMaintenanceRecords([...maintenanceRecords, { ...newRecord, id: Date.now() }]);
    setIsFormOpen(false);
  };

  const handleUpdateMaintenance = (updatedRecord: any) => {
    setMaintenanceRecords(maintenanceRecords.map(record => record.id === updatedRecord.id ? updatedRecord : record));
    setIsFormOpen(false);
    setEditingMaintenance(null);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'مكتملة';
      case 'pending':
        return 'قيد الانتظار';
      case 'canceled':
        return 'ملغاة';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        إدارة الصيانة
      </h2>

      <div className="flex flex-col sm:flex-row items-center mb-4 space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-reverse">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="البحث عن أصل أو وصف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pr-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center">
          <label htmlFor="startDate" className="text-sm text-gray-700 ml-2">من:</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
          />
        </div>
        <div className="flex items-center">
          <label htmlFor="endDate" className="text-sm text-
