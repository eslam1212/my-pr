import React, { useState } from 'react';
import { UserForm } from '../components/users/UserForm';
import userService from '../services/userService';
export function UsersPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Partial<UserFormData> | undefined>(undefined);

  const handleAddUser = async (data: { username: string; email: string; password: string; role: "admin" | "accountant" | "viewer"; }) => {
    console.log('User added/updated:', data);
    setIsFormOpen(false);
  };

  return (
    <div>
      <button
        onClick={() => {
          setSelectedUser(null);
          setIsFormOpen(true);
        }}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md"
      >
        إضافة مستخدم جديد
      </button>

      {isFormOpen && (
        <UserForm
          onSubmit={handleAddUser}
          onClose={() => setIsFormOpen(false)}
          initialData={selectedUser}
        />
      )}
    </div>
  );
}
