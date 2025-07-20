import React, { useState, useEffect, useCallback } from 'react';
import { Permission } from '../../types/database.types';
import { permissionService } from '../../services/permissionService';
import { groupPermissionService } from '../../services/groupPermissionService';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';
import { Checkbox } from '../ui/checkbox'; // Assuming Checkbox component is available
import { Label } from '../ui/label';

interface GroupPermissionsManagerProps {
  groupId: number;
  groupName: string; // For display purposes
}

const GroupPermissionsManager: React.FC<GroupPermissionsManagerProps> = ({ groupId, groupName }) => {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [assignedPermissions, setAssignedPermissions] = useState<number[]>([]); // Store IDs of assigned permissions
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPermissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [allPerms, groupPermsData] = await Promise.all([
        permissionService.getAllPermissions(),
        groupPermissionService.getPermissionsForGroup(groupId),
      ]);
      setAllPermissions(allPerms);
      setAssignedPermissions(groupPermsData.map(p => p.id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل في تحميل الأذونات.';
      setError(errorMessage);
      toast({ title: 'خطأ', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [groupId, toast]);

  useEffect(() => {
    if (groupId) {
      fetchPermissions();
    }
  }, [groupId, fetchPermissions]);

  const handlePermissionToggle = (permissionId: number) => {
    setAssignedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await groupPermissionService.setPermissionsForGroup(groupId, assignedPermissions);
      toast({ title: 'نجاح', description: 'تم تحديث أذونات المجموعة بنجاح.' });
      fetchPermissions(); // Refresh to confirm
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل في حفظ أذونات المجموعة.';
      setError(errorMessage);
      toast({ title: 'خطأ', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-4">جاري تحميل الأذونات...</div>;
  }

  if (error && allPermissions.length === 0) { // Show error only if we couldn't load initial permissions
    return <div className="p-4 text-red-500">خطأ: {error}</div>;
  }

  // Group permissions by a common prefix (e.g., "products", "invoices") for better UI
  const groupedPermissions: Record<string, Permission[]> = allPermissions.reduce((acc, perm) => {
    const groupKey = perm.name.split(':')[0] || 'general';
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);


  return (
    <div className="p-4 border rounded-lg mt-6">
      <h3 className="text-lg font-semibold mb-1">إدارة أذونات المجموعة: {groupName}</h3>
      <p className="text-sm text-gray-600 mb-4">حدد الأذونات التي ترغب في منحها لهذه المجموعة.</p>

      {error && <p className="text-red-500 mb-3">خطأ أثناء الحفظ: {error}</p>}

      <div className="space-y-4">
        {Object.entries(groupedPermissions).map(([groupKey, permissions]) => (
          <div key={groupKey} className="border p-3 rounded-md">
            <h4 className="capitalize font-medium mb-2 text-indigo-700">{groupKey.replace(/_/g, ' ')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {permissions.map(permission => (
                <div key={permission.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                  <Checkbox
                    id={`perm-${permission.id}`}
                    checked={assignedPermissions.includes(permission.id)}
                    onCheckedChange={() => handlePermissionToggle(permission.id)}
                    disabled={isSaving}
                  />
                  <Label htmlFor={`perm-${permission.id}`} className="text-sm cursor-pointer flex-1">
                    {permission.name}
                    {permission.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{permission.description}</p>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSaveChanges} disabled={isLoading || isSaving}>
          {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>
    </div>
  );
};

export default GroupPermissionsManager;
