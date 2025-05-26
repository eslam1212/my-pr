import React, { useState, useEffect } from 'react';
import { UserGroup } from '../../types/database.types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../ui/dialog'; // Assuming Dialog components are available

interface UserGroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (groupData: Omit<UserGroup, 'id' | 'created_at' | 'updated_at'> | UserGroup) => void;
  group: UserGroup | null; // Pass null for new group, existing group object for editing
}

export const UserGroupFormModal: React.FC<UserGroupFormModalProps> = ({ isOpen, onClose, onSave, group }) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (group) {
      setGroupName(group.group_name);
      setDescription(group.description || '');
    } else {
      setGroupName('');
      setDescription('');
    }
    setFormError(null); // Reset error when group or isOpen changes
  }, [group, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setFormError('اسم المجموعة مطلوب.');
      return;
    }
    setFormError(null);
    
    const commonData = {
      group_name: groupName,
      description: description,
    };

    if (group && group.id) {
      onSave({ ...commonData, id: group.id, created_at: group.created_at, updated_at: group.updated_at });
    } else {
      onSave(commonData);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{group ? 'تعديل مجموعة المستخدمين' : 'إنشاء مجموعة مستخدمين جديدة'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="groupName" className="text-right col-span-1">
                اسم المجموعة
              </Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right col-span-1">
                الوصف (اختياري)
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            {formError && <p className="col-span-4 text-red-500 text-sm">{formError}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
            </DialogClose>
            <Button type="submit">حفظ</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
