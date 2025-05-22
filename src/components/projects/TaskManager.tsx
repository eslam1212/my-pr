import React, { useState } from 'react';
import { Plus, Edit, Trash2, CheckCircle, Circle, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const mockTasks = [
  { id: 1, name: 'تصميم واجهة المستخدم', completed: true },
  { id: 2, name: 'تطوير الواجهة الخلفية', completed: false },
  { id: 3, name: 'اختبار النظام', completed: false },
];

const taskSchema = z.object({
  name: z.string().min(3, 'اسم المهمة يجب أن يكون 3 أحرف على الأقل'),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  onSubmit: (data: TaskFormData) => void;
  onClose: () => void;
  initialData?: Partial<TaskFormData> | null;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, onClose, initialData }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: initialData || {}
  });

  React.useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: TaskFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">اسم المهمة</label>
        <input
          {...register('name')}
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
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
          {initialData ? 'تحديث' : 'إضافة'}
        </button>
      </div>
    </form>
  );
};

export function TaskManager() {
  const [tasks, setTasks] = useState(mockTasks);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const handleAddTask = (newTask: TaskFormData) => {
    setTasks([...tasks, { id: Date.now(), name: newTask.name, completed: false }]);
    setIsFormOpen(false);
  };

  const handleUpdateTask = (updatedTask: TaskFormData) => {
    setTasks(tasks.map(task => task.id === editingTask.id ? { ...task, name: updatedTask.name } : task));
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const handleToggleComplete = (id: number) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            إدارة المهام
          </h2>
          <p className="text-gray-500">
            هنا يمكنك إدارة مهام المشروع
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => {
              setEditingTask(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة مهمة
          </button>
        </div>
      </div>

      <div className="overflow-x-auto mt-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase sm:px-6">
                المهمة
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">إجراءات</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.map((task) => (
              <tr key={task.id}>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 sm:px-6">
                  <div className="flex items-center">
                    <button
                      onClick={() => handleToggleComplete(task.id)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      {task.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    <div className="mr-4">
                      <div className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {task.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <button
                    onClick={() => handleEditTask(task)}
                    className="text-indigo-600 hover:text-indigo-900 ml-4"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" dir="rtl">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{editingTask ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <TaskForm
              onSubmit={editingTask ? handleUpdateTask : handleAddTask}
              onClose={() => setIsFormOpen(false)}
              initialData={editingTask}
            />
          </div>
        </div>
      )}
    </div>
  );
}
