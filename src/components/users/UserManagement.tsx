import React, { useState } from 'react';
import { User as UserIcon, Edit, Trash2, Plus, Search } from 'lucide-react';
import { UserForm } from './UserForm';
import { useAuth } from '../../hooks/useAuth';
import { AuthUser, UserRole } from '../../types/auth';
import { PageWrapper } from '../layout/PageWrapper';

// قائمة المستخدمين للتجربة
const mockUsers: AuthUser[] = [
  {
    id: '1',
    username: 'أحمد محمد',
    email: 'ahmed@example.com',
    role: 'admin',
    permissions: ['users.manage', 'customers.manage']
  },
  {
    id: '2',
    username: 'سارة أحمد',
    email: 'sara@example.com',
    role: 'accountant',
    permissions: ['customers.view', 'invoices.manage']
  },
  {
    id: '3',
    username: 'محمد علي',
    email: 'mohamed@example.com',
    role: 'viewer',
    permissions: ['customers.view', 'reports.view']
  }
];

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>(mockUsers);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddUser = (data: any) => {
    const newUser: AuthUser = {
      id: (users.length + 1).toString(),
      username: data.username,
      email: data.email,
      role: data.role as UserRole,
      permissions: []
    };
    setUsers([...users, newUser]);
    setIsFormOpen(false);
  };

  const handleEditUser = (data: any) => {
    if (editingUser) {
      const updatedUsers = users.map(user => 
        user.id === editingUser.id 
          ? { ...user, ...data }
          : user
      );
      setUsers(updatedUsers);
      setEditingUser(null);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.includes(searchTerm) || 
    user.email.includes(searchTerm)
  );

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'accountant':
        return 'bg-blue-100 text-blue-800';
      case 'viewer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'مدير النظام';
      case 'accountant':
        return 'محاسب';
      case 'viewer':
        return 'مستخدم';
      default:
        return role;
    }
  };

  return (
    <PageWrapper className="p-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">إدارة المستخدمين</h1>
          <p className="mt-2 text-sm text-gray-700">
            قائمة بجميع المستخدمين في النظام مع إمكانية إضافة وتعديل وحذف المستخدمين
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="mt-4 sm:mt-0 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة مستخدم جديد
        </button>
      </div>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="البحث عن مستخدم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pr-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المستخدم
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      البريد الإلكتروني
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الدور
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">إجراءات</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-indigo-600" />
                            </div>
                          </div>
                          <div className="mr-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="text-indigo-600 hover:text-indigo-900 ml-4"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {currentUser?.id !== user.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {(isFormOpen || editingUser) && (
        <UserForm
          onSubmit={editingUser ? handleEditUser : handleAddUser}
          onClose={() => {
            setIsFormOpen(false);
            setEditingUser(null);
          }}
          initialData={editingUser ?? undefined}
        />
      )}
    </PageWrapper>
  );
}
