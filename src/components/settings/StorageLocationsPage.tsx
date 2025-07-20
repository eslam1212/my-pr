import React, { useState, useEffect, useCallback } from 'react';
import { StorageLocation } from '../../types';
import { storageLocationService } from '../../services/storageLocationService';
import { Button } from '../ui/button';
import { PlusCircle, Edit, Trash2, Star, Home } from 'lucide-react';
import { useToast } from '../ui/use-toast';
import { StorageLocationFormModal } from './StorageLocationFormModal';
import { PageWrapper } from '../layout/PageWrapper'; // Assuming a general PageWrapper

const StorageLocationsPage: React.FC = () => {
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Partial<StorageLocation> | null>(null);
  const { toast } = useToast();

  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedLocations = await storageLocationService.getAll();
      setLocations(fetchedLocations);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل في تحميل مواقع التخزين.';
      setError(errorMessage);
      toast({ title: 'خطأ', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleCreateNew = () => {
    setSelectedLocation(null); // Ensure it's null for new
    setIsModalOpen(true);
  };

  const handleEdit = (location: StorageLocation) => {
    setSelectedLocation(location);
    setIsModalOpen(true);
  };

  const handleDelete = async (locationId: string) => {
    const locationToDelete = locations.find(loc => loc.id === locationId);
    if (locationToDelete?.is_default) {
        toast({ title: 'تنبيه', description: 'لا يمكن حذف الموقع الافتراضي. يرجى تعيين موقع آخر كافتراضي أولاً.', variant: 'warning' });
        return;
    }
    if (!window.confirm(`هل أنت متأكد أنك تريد حذف موقع التخزين "${locationToDelete?.name}"؟`)) {
      return;
    }
    try {
      await storageLocationService.delete(locationId);
      toast({ title: 'نجاح', description: 'تم حذف موقع التخزين بنجاح.' });
      fetchLocations(); // Refresh list
    } catch (err: any) {
      const errorMessage = err.message || 'فشل في حذف موقع التخزين.';
      toast({ title: 'خطأ', description: errorMessage, variant: 'destructive' });
    }
  };

  const handleSetAsDefault = async (locationId: string) => {
    try {
        await storageLocationService.setAsDefault(locationId);
        toast({ title: 'نجاح', description: 'تم تعيين الموقع كافتراضي بنجاح.' });
        fetchLocations();
    } catch (err: any) {
        const errorMessage = err.message || 'فشل في تعيين الموقع كافتراضي.';
        toast({ title: 'خطأ', description: errorMessage, variant: 'destructive' });
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedLocation(null);
  };

  const handleModalSave = async (locationData: Omit<StorageLocation, 'id' | 'created_at' | 'updated_at'> | StorageLocation) => {
    try {
      if ('id' in locationData && locationData.id) { // Existing location
        await storageLocationService.update(locationData.id, {
            name: locationData.name,
            description: locationData.description,
            is_default: locationData.is_default
        });
        toast({ title: 'نجاح', description: 'تم تحديث موقع التخزين بنجاح.' });
      } else { // New location
        await storageLocationService.create(locationData as Omit<StorageLocation, 'id' | 'created_at' | 'updated_at'>);
        toast({ title: 'نجاح', description: 'تم إنشاء موقع التخزين بنجاح.' });
      }
      fetchLocations(); // Refresh list
      handleModalClose();
    } catch (err: any) {
      const errorMessage = err.message || 'فشل في حفظ موقع التخزين.';
      toast({ title: 'خطأ', description: errorMessage, variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <PageWrapper><div className="p-4 text-center">جاري تحميل مواقع التخزين...</div></PageWrapper>;
  }

  if (error) {
    return <PageWrapper><div className="p-4 text-red-500 text-center">خطأ: {error}</div></PageWrapper>;
  }

  return (
    <PageWrapper className="p-4 md:p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">إدارة مواقع التخزين</h1>
        <Button onClick={handleCreateNew} className="flex items-center gap-2">
          <PlusCircle className="h-5 w-5" /> إنشاء موقع جديد
        </Button>
      </div>

      <StorageLocationFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        location={selectedLocation}
      />

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {locations.length === 0 ? (
          <p className="text-center text-gray-500 py-10">لا توجد مواقع تخزين معرفة. قم بإنشاء موقع جديد للبدء.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الوصف</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">افتراضي</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الإنشاء</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{loc.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{loc.description || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {loc.is_default ? <Star className="h-5 w-5 text-yellow-400 inline" /> : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(loc.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium space-x-1 space-x-reverse">
                      {!loc.is_default && (
                        <Button variant="outline" size="sm" onClick={() => handleSetAsDefault(loc.id)} title="تعيين كافتراضي">
                           <Home className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleEdit(loc)} title="تعديل">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!loc.is_default && ( // Prevent deleting default location from UI directly
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(loc.id)} title="حذف">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default StorageLocationsPage;
