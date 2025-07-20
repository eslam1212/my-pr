import React, { useState, useEffect, useCallback } from 'react';
import { UserGroup } from '../../types/database.types';
import { userGroupService } from '../../services/userGroupService';
import { Button } from '../ui/button';
import { PlusCircle, Edit, Trash2, Settings2 } from 'lucide-react'; // Added Settings2
import { useToast } from '../ui/use-toast';
import { UserGroupFormModal } from './UserGroupFormModal';
import GroupPermissionsManager from './GroupPermissionsManager'; // Import the permissions manager

const UserGroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false); // Renamed for clarity
  const [selectedGroupForForm, setSelectedGroupForForm] = useState<UserGroup | null>(null);
  const [managingPermissionsForGroup, setManagingPermissionsForGroup] = useState<UserGroup | null>(null);

  const { toast } = useToast();

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedGroups = await userGroupService.getAllUserGroups();
      setGroups(fetchedGroups);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل في تحميل مجموعات المستخدمين';
      setError(errorMessage);
      toast({
        title: 'خطأ',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreateNew = () => {
    setSelectedGroupForForm(null);
    setIsFormModalOpen(true);
  };

  const handleEditGroupDetails = (group: UserGroup) => {
    setSelectedGroupForForm(group);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (groupId: number) => {
    if (!window.confirm('هل أنت متأكد أنك تريد حذف هذه المجموعة؟')) {
      return;
    }
    try {
      await userGroupService.deleteUserGroup(groupId);
      toast({
        title: 'نجاح',
        description: 'تم حذف المجموعة بنجاح.',
      });
      fetchGroups(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل في حذف المجموعة.';
      toast({
        title: 'خطأ',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleFormModalClose = () => {
    setIsFormModalOpen(false);
    setSelectedGroupForForm(null);
  };

  const handleFormModalSave = async (groupData: Omit<UserGroup, 'id' | 'created_at' | 'updated_at'> | UserGroup) => {
    try {
      if ('id' in groupData && groupData.id) { // Existing group
        await userGroupService.updateUserGroup(groupData.id, { group_name: groupData.group_name, description: groupData.description });
        toast({ title: 'نجاح', description: 'تم تحديث المجموعة بنجاح.' });
      } else { // New group
        await userGroupService.createUserGroup({ group_name: groupData.group_name, description: groupData.description });
        toast({ title: 'نجاح', description: 'تم إنشاء المجموعة بنجاح.' });
      }
      fetchGroups(); // Refresh list
      handleFormModalClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل في حفظ المجموعة.';
      toast({
        title: 'خطأ',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div className="p-4">جاري تحميل مجموعات المستخدمين...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">خطأ: {error}</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">إدارة مجموعات المستخدمين</h1>
        {managingPermissionsForGroup ? (
          <Button onClick={() => setManagingPermissionsForGroup(null)} variant="outline">
            العودة إلى قائمة المجموعات
          </Button>
        ) : (
          <Button onClick={handleCreateNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> إنشاء مجموعة جديدة
          </Button>
        )}
      </div>

      <UserGroupFormModal
        isOpen={isFormModalOpen}
        onClose={handleFormModalClose}
        onSave={handleFormModalSave}
        group={selectedGroupForForm}
      />

      {managingPermissionsForGroup ? (
        <GroupPermissionsManager
          groupId={managingPermissionsForGroup.id}
          groupName={managingPermissionsForGroup.group_name}
        />
      ) : (
        <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                اسم المجموعة
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الوصف
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                تاريخ الإنشاء
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {groups.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  لا توجد مجموعات مستخدمين.
                </td>
              </tr>
            ) : (
              groups.map((group) => (
                <tr key={group.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{group.group_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{group.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(group.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditGroupDetails(group)} title="تعديل اسم/وصف المجموعة">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setManagingPermissionsForGroup(group)} title="إدارة أذونات المجموعة">
                      <Settings2 className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(group.id)} title="حذف المجموعة">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
};

export default UserGroupsPage;
