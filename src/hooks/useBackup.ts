import { useState } from 'react';
import { BackupService } from '../services/backup';

export interface Backup {
  id: string;
  createdAt: Date;
  size: string;
  path: string;
}

export function useBackup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backups, setBackups] = useState<Backup[]>([
    {
      id: '1',
      createdAt: new Date('2024-03-15'),
      size: '2.5 MB',
      path: '/backups/backup-2024-03-15.zip'
    },
    {
      id: '2',
      createdAt: new Date('2024-03-14'),
      size: '2.3 MB',
      path: '/backups/backup-2024-03-14.zip'
    }
  ]);

  const createBackup = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const newBackup = await BackupService.create();
      setBackups(prev => [newBackup, ...prev]);
      return true;
    } catch (error) {
      setError('حدث خطأ أثناء إنشاء النسخة الاحتياطية');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBackup = async (backup: Backup) => {
    try {
      setIsLoading(true);
      setError(null);
      await BackupService.download(backup);
      return true;
    } catch (error) {
      setError('حدث خطأ أثناء تحميل النسخة الاحتياطية');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const restoreBackup = async (file: File) => {
    if (!window.confirm('هل أنت متأكد من استعادة هذه النسخة؟ سيتم استبدال جميع البيانات الحالية.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await BackupService.restore(file);
      return true;
    } catch (error) {
      setError('حدث خطأ أثناء استعادة النسخة الاحتياطية');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBackup = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه النسخة الاحتياطية؟')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await BackupService.delete(id);
      setBackups(prev => prev.filter(backup => backup.id !== id));
      return true;
    } catch (error) {
      setError('حدث خطأ أثناء حذف النسخة الاحتياطية');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  return {
    createBackup,
    downloadBackup,
    restoreBackup,
    deleteBackup,
    backups,
    isLoading,
    error,
    selectedFile,
    handleFileSelect
  };
}
