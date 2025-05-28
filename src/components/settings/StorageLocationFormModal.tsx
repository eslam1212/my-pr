import React, { useState, useEffect } from 'react';
import { StorageLocation } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../ui/dialog';

interface StorageLocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (locationData: Omit<StorageLocation, 'id' | 'created_at' | 'updated_at'> | StorageLocation) => void;
  location: Partial<StorageLocation> | null; // Pass null for new, existing for editing
}

export const StorageLocationFormModal: React.FC<StorageLocationFormModalProps> = ({ isOpen, onClose, onSave, location }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (location) {
      setName(location.name || '');
      setDescription(location.description || '');
      setIsDefault(location.is_default || false);
    } else {
      setName('');
      setDescription('');
      setIsDefault(false);
    }
    setFormError(null);
  }, [location, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('اسم الموقع مطلوب.');
      return;
    }
    setFormError(null);
    
    const commonData = {
      name,
      description,
      is_default: isDefault,
    };

    if (location && location.id) { // Editing existing location
      onSave({ ...commonData, id: location.id, created_at: location.created_at || '', updated_at: location.updated_at || '' });
    } else { // New location
      onSave(commonData);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{location?.id ? 'تعديل موقع التخزين' : 'إنشاء موقع تخزين جديد'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} dir="rtl">
          <div className="grid gap-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="locationName" className="text-right">اسم الموقع</Label>
              <Input
                id="locationName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="locationDescription" className="text-right">الوصف (اختياري)</Label>
              <Textarea
                id="locationDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2 space-x-reverse mt-2">
              <Checkbox
                id="isDefaultLocation"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked as boolean)}
              />
              <Label htmlFor="isDefaultLocation" className="cursor-pointer">تعيين كموقع افتراضي</Label>
            </div>
            {formError && <p className="col-span-4 text-red-500 text-sm">{formError}</p>}
          </div>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button type="submit">حفظ</Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">إلغاء</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
