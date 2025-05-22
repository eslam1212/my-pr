import React, { useEffect } from 'react';
import { X, Download, Upload, Trash2, Calendar } from 'lucide-react';
import { useBackup } from '../../hooks/useBackup';
import { formatDate } from '../../utils/format';
import { toast } from '@/components/ui/use-toast';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BackupModal({ isOpen, onClose }: BackupModalProps) {
  const { 
    createBackup, 
    restoreBackup, 
    deleteBackup,
    downloadBackup,
    backups, 
    isLoading,
    error,
    selectedFile,
    handleFileSelect
  } = useBackup();

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose, isLoading]);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" 
      dir="rtl"
      onClick={handleOverlayClick}
    >
      <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">إدارة النسخ الاحتياطية</h3>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (!isLoading) onClose();
            }} 
            className="text-gray-400 hover:text-gray-500 disabled:opacity-50"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">إنشاء نسخة احتياطية جديدة</h4>
          <button
            onClick={(e) => {
              e.stopPropagation();
              createBackup().then(success => {
                if (success) {
                  toast({
                    title: "تم بنجاح",
                    description: "تم إنشاء النسخة الاحتياطية بنجاح",
                  });
                } else {
                  toast({
                    variant: "destructive",
                    title: "خطأ",
                    description: error || "حدث خطأ أثناء إنشاء النسخة الاحتياطية",
                  });
                }
              });
            }}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <Download className="h-4 w-4 ml-2" />
            {isLoading ? 'جاري الإنشاء...' : 'إنشاء نسخة جديدة'}
          </button>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">استعادة نسخة احتياطية</h4>
          <div className="flex items-center space-x-2 space-x-reverse">
            <input
              type="file"
              accept=".zip,.sql"
              onChange={handleFileSelect}
              disabled={isLoading}
              onClick={(e) => e.stopPropagation()}
              className="block w-full text-sm text-gray-500 file:ml-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 disabled:opacity-50"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!selectedFile) return;
                
                if (!window.confirm('هل أنت متأكد من استعادة هذه النسخة؟ سيتم استبدال جميع البيانات الحالية.')) {
                  return;
                }

                restoreBackup(selectedFile).then(success => {
                  if (success) {
                    toast({
                      title: "تم بنجاح",
                      description: "تم استعادة النسخة الاحتياطية بنجاح",
                    });
                    onClose();
                  } else {
                    toast({
                      variant: "destructive",
                      title: "خطأ",
                      description: error || "حدث خطأ أثناء استعادة النسخة الاحتياطية",
                    });
                  }
                });
              }}
              disabled={!selectedFile || isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Upload className="h-4 w-4 ml-2" />
              {isLoading ? 'جاري الاستعادة...' : 'استعادة'}
            </button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200" onClick={(e) => e.stopPropagation()}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">التاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الحجم</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {backups.map((backup) => (
                <tr key={backup.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 ml-2" />
                      {formatDate(backup.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {backup.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2 space-x-reverse">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadBackup(backup).then(success => {
                            if (success) {
                              toast({
                                title: "تم بنجاح",
                                description: "تم تحميل النسخة الاحتياطية بنجاح",
                              });
                            } else {
                              toast({
                                variant: "destructive",
                                title: "خطأ",
                                description: error || "حدث خطأ أثناء تحميل النسخة الاحتياطية",
                              });
                            }
                          });
                        }}
                        disabled={isLoading}
                        className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!window.confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟')) {
                            return;
                          }

                          deleteBackup(backup.id).then(success => {
                            if (success) {
                              toast({
                                title: "تم بنجاح",
                                description: "تم حذف النسخة الاحتياطية بنجاح",
                              });
                            } else {
                              toast({
                                variant: "destructive",
                                title: "خطأ",
                                description: error || "حدث خطأ أثناء حذف النسخة الاحتياطية",
                              });
                            }
                          });
                        }}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {backups.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                    لا توجد نسخ احتياطية
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
