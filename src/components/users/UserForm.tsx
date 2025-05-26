import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import { useForm, Controller } from 'react-hook-form'; // Added Controller
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { UserRole } from '../../types/auth'; // This might be deprecated in favor of groups
import { PageWrapper } from '../layout/PageWrapper';
import { UserGroup } from '../../types/database.types'; // Import UserGroup
import { userGroupService } from '../../services/userGroupService'; // Import group service
import { userAssignmentService } from '../../services/userAssignmentService'; // Import assignment service
import { useToast } from '../ui/use-toast'; // For feedback

// Extend schema to include groupId
const userSchema = z.object({
  id: z.string().optional(), // For editing existing user
  username: z.string().min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل').optional(), // Optional for edit
  role: z.enum(['admin', 'accountant', 'viewer'] as const).optional(), // Role might be deprecated or used as a fallback
  groupId: z.string().optional(), // Group ID, string because select input values are strings
});

export type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  onSubmit: (data: UserFormData, originalUserId?: string) => Promise<void>; // Make onSubmit async and pass originalUserId
  onClose: () => void;
  initialData?: Partial<UserFormData> & { id?: string }; // Ensure initialData can have id
  userIdToEdit?: string; // Explicitly pass userId for fetching current group
}

export function UserForm({ onSubmit, onClose, initialData, userIdToEdit }: UserFormProps) {
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, control, reset, setValue } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: initialData,
  });

  useEffect(() => {
    setIsLoadingGroups(true);
    userGroupService.getAllUserGroups()
      .then(groups => setUserGroups(groups))
      .catch(error => {
        console.error("Failed to fetch user groups", error);
        toast({ title: "خطأ", description: "فشل في تحميل مجموعات المستخدمين.", variant: "destructive" });
      })
      .finally(() => setIsLoadingGroups(false));
  }, [toast]);
  
  useEffect(() => {
    // If editing, fetch current user's group and set it
    if (userIdToEdit) {
      userAssignmentService.getUserGroup(userIdToEdit)
        .then(group => {
          if (group) {
            setValue('groupId', String(group.id));
          }
        })
        .catch(error => console.error("Failed to fetch user's current group", error));
    }
  }, [userIdToEdit, setValue]);

  // Reset form when initialData changes (e.g., when opening for a new user or different user)
  useEffect(() => {
    if (initialData) {
      reset(initialData);
      if (userIdToEdit) { // Re-fetch group for the new user being edited
        userAssignmentService.getUserGroup(userIdToEdit)
          .then(group => {
            if (group) setValue('groupId', String(group.id));
            else setValue('groupId', ''); // Clear if no group
          })
          .catch(error => console.error("Failed to fetch user's current group", error));
      } else {
         setValue('groupId', ''); // Clear for new user
      }
    } else {
      reset({ username: '', email: '', password: '', role: undefined, groupId: '' }); // Reset to empty for new user
    }
  }, [initialData, reset, userIdToEdit, setValue]);


  const handleFormSubmit = async (data: UserFormData) => {
    // Password is not required when editing unless it's explicitly provided
    if (initialData && !data.password) {
      delete data.password;
    }
    await onSubmit(data, userIdToEdit); // Pass userIdToEdit back if needed by parent for update logic
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <PageWrapper className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{initialData ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              اسم المستخدم
            </label>
            <input
              {...register('username')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="أدخل اسم المستخدم"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              البريد الإلكتروني
            </label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="example@domain.com"
              dir="ltr"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {!initialData && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                كلمة المرور
              </label>
              <input
                {...register('password')}
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="********"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الدور
            </label>
            <select
              {...register('role')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">-- اختر دور (اختياري) --</option>
              <option value="admin">مدير النظام</option>
              <option value="accountant">محاسب</option>
              <option value="viewer">مستخدم</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              مجموعة المستخدمين
            </label>
            <Controller
              name="groupId"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  disabled={isLoadingGroups}
                >
                  <option value="">-- اختر مجموعة --</option>
                  {userGroups.map(group => (
                    <option key={group.id} value={String(group.id)}>
                      {group.group_name}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.groupId && (
              <p className="mt-1 text-sm text-red-600">{errors.groupId.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
            >
              {userIdToEdit ? 'تحديث المستخدم' : 'إضافة المستخدم'}
            </button>
          </div>
        </form>
      </PageWrapper>
    </div>
  );
}
