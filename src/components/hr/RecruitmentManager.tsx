import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'react-toastify';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

const jobSchema = z.object({
  title: z.string().min(2, 'العنوان مطلوب'),
  department: z.string().min(2, 'القسم مطلوب'),
  description: z.string().min(10, 'الوصف مطلوب'),
  requirements: z.string().min(10, 'المتطلبات مطلوبة'),
  salary_range: z.string().min(1, 'نطاق الراتب مطلوب'),
  status: z.enum(['open', 'closed', 'on_hold'], {
    required_error: 'الحالة مطلوبة',
  }),
});

const applicationSchema = z.object({
  job_id: z.string().min(1, 'اختر الوظيفة'),
  applicant_name: z.string().min(2, 'اسم المتقدم مطلوب'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  phone: z.string().min(10, 'رقم الهاتف غير صالح'),
  experience_years: z.string().transform(Number),
  education: z.string().min(2, 'المؤهل التعليمي مطلوب'),
  status: z.enum(['new', 'under_review', 'interviewed', 'accepted', 'rejected'], {
    required_error: 'الحالة مطلوبة',
  }),
  notes: z.string().optional(),
});

type Job = z.infer<typeof jobSchema>;
type Application = z.infer<typeof applicationSchema>;

export function RecruitmentManager() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs');

  const jobForm = useForm<Job>({
    resolver: zodResolver(jobSchema),
  });

  const applicationForm = useForm<Application>({
    resolver: zodResolver(applicationSchema),
  });

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, []);

  async function fetchJobs() {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      toast.error('حدث خطأ في جلب الوظائف');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchApplications() {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            title
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      toast.error('حدث خطأ في جلب طلبات التوظيف');
    }
  }

  const onJobSubmit = async (data: Job) => {
    try {
      const { error } = await supabase.from('jobs').insert([data]);
      if (error) throw error;
      
      toast.success('تم إضافة الوظيفة بنجاح');
      setIsJobDialogOpen(false);
      jobForm.reset();
      fetchJobs();
    } catch (error) {
      toast.error('حدث خطأ في إضافة الوظيفة');
    }
  };

  const onApplicationSubmit = async (data: Application) => {
    try {
      const { error } = await supabase.from('applications').insert([data]);
      if (error) throw error;
      
      toast.success('تم إضافة طلب التوظيف بنجاح');
      setIsApplicationDialogOpen(false);
      applicationForm.reset();
      fetchApplications();
    } catch (error) {
      toast.error('حدث خطأ في إضافة طلب التوظيف');
    }
  };

  const getJobStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'مفتوحة';
      case 'closed':
        return 'مغلقة';
      case 'on_hold':
        return 'معلقة';
      default:
        return status;
    }
  };

  const getApplicationStatusText = (status: string) => {
    switch (status) {
      case 'new':
        return 'جديد';
      case 'under_review':
        return 'قيد المراجعة';
      case 'interviewed':
        return 'تمت المقابلة';
      case 'accepted':
        return 'مقبول';
      case 'rejected':
        return 'مرفوض';
      default:
        return status;
    }
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'text-blue-600';
      case 'under_review':
        return 'text-yellow-600';
      case 'interviewed':
        return 'text-purple-600';
      case 'accepted':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  async function updateApplicationStatus(id: string, status: Application['status']) {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('تم تحديث حالة الطلب بنجاح');
      fetchApplications();
    } catch (error) {
      toast.error('حدث خطأ في تحديث حالة الطلب');
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-gray-900">إدارة التوظيف</h2>
        <div className="space-x-2">
          <Button
            variant={activeTab === 'jobs' ? 'default' : 'outline'}
            onClick={() => setActiveTab('jobs')}
          >
            الوظائف
          </Button>
          <Button
            variant={activeTab === 'applications' ? 'default' : 'outline'}
            onClick={() => setActiveTab('applications')}
          >
            طلبات التوظيف
          </Button>
        </div>
      </div>

      {activeTab === 'jobs' ? (
        <>
          <div className="flex justify-end mb-4">
            <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
              <DialogTrigger asChild>
                <Button>إضافة وظيفة جديدة</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إضافة وظيفة جديدة</DialogTitle>
                </DialogHeader>
                <form onSubmit={jobForm.handleSubmit(onJobSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="title">عنوان الوظيفة</Label>
                    <Input id="title" {...jobForm.register('title')} />
                    {jobForm.formState.errors.title && (
                      <p className="text-red-500 text-sm">{jobForm.formState.errors.title.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="department">القسم</Label>
                    <Input id="department" {...jobForm.register('department')} />
                    {jobForm.formState.errors.department && (
                      <p className="text-red-500 text-sm">{jobForm.formState.errors.department.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="description">الوصف</Label>
                    <Input id="description" {...jobForm.register('description')} />
                    {jobForm.formState.errors.description && (
                      <p className="text-red-500 text-sm">{jobForm.formState.errors.description.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="requirements">المتطلبات</Label>
                    <Input id="requirements" {...jobForm.register('requirements')} />
                    {jobForm.formState.errors.requirements && (
                      <p className="text-red-500 text-sm">{jobForm.formState.errors.requirements.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="salary_range">نطاق الراتب</Label>
                    <Input id="salary_range" {...jobForm.register('salary_range')} />
                    {jobForm.formState.errors.salary_range && (
                      <p className="text-red-500 text-sm">{jobForm.formState.errors.salary_range.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="status">الحالة</Label>
                    <select
                      id="status"
                      className="w-full rounded-md border border-gray-300 p-2"
                      {...jobForm.register('status')}
                    >
                      <option value="">اختر الحالة</option>
                      <option value="open">مفتوحة</option>
                      <option value="closed">مغلقة</option>
                      <option value="on_hold">معلقة</option>
                    </select>
                    {jobForm.formState.errors.status && (
                      <p className="text-red-500 text-sm">{jobForm.formState.errors.status.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full">
                    إضافة
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="text-center py-4">جاري التحميل...</div>
          ) : jobs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">لا يوجد وظائف متاحة</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">عنوان الوظيفة</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">القسم</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">نطاق الراتب</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{job.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{job.department}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{job.salary_range}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {getJobStatusText(job.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex justify-end mb-4">
            <Dialog open={isApplicationDialogOpen} onOpenChange={setIsApplicationDialogOpen}>
              <DialogTrigger asChild>
                <Button>إضافة طلب توظيف</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إضافة طلب توظيف</DialogTitle>
                </DialogHeader>
                <form onSubmit={applicationForm.handleSubmit(onApplicationSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="job_id">الوظيفة</Label>
                    <select
                      id="job_id"
                      className="w-full rounded-md border border-gray-300 p-2"
                      {...applicationForm.register('job_id')}
                    >
                      <option value="">اختر الوظيفة</option>
                      {jobs
                        .filter((job) => job.status === 'open')
                        .map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.title}
                          </option>
                        ))}
                    </select>
                    {applicationForm.formState.errors.job_id && (
                      <p className="text-red-500 text-sm">{applicationForm.formState.errors.job_id.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="applicant_name">اسم المتقدم</Label>
                    <Input id="applicant_name" {...applicationForm.register('applicant_name')} />
                    {applicationForm.formState.errors.applicant_name && (
                      <p className="text-red-500 text-sm">{applicationForm.formState.errors.applicant_name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      {...applicationForm.register('email')}
                    />
                    {applicationForm.formState.errors.email && (
                      <p className="text-red-500 text-sm">{applicationForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...applicationForm.register('phone')}
                    />
                    {applicationForm.formState.errors.phone && (
                      <p className="text-red-500 text-sm">{applicationForm.formState.errors.phone.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="experience_years">سنوات الخبرة</Label>
                    <Input
                      id="experience_years"
                      type="number"
                      {...applicationForm.register('experience_years')}
                    />
                    {applicationForm.formState.errors.experience_years && (
                      <p className="text-red-500 text-sm">{applicationForm.formState.errors.experience_years.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="education">المؤهل التعليمي</Label>
                    <Input id="education" {...applicationForm.register('education')} />
                    {applicationForm.formState.errors.education && (
                      <p className="text-red-500 text-sm">{applicationForm.formState.errors.education.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="notes">ملاحظات</Label>
                    <Input id="notes" {...applicationForm.register('notes')} />
                  </div>
                  <input
                    type="hidden"
                    value="new"
                    {...applicationForm.register('status')}
                  />
                  <Button type="submit" className="w-full">
                    إضافة
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="text-center py-4">جاري التحميل...</div>
          ) : applications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">لا يوجد طلبات توظيف</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">الوظيفة</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">المتقدم</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">البريد الإلكتروني</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">الخبرة</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">المؤهل</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">الحالة</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {applications.map((application) => (
                    <tr key={application.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {application.jobs?.title}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {application.applicant_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {application.email}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {application.experience_years} سنوات
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {application.education}
                      </td>
                      <td className={`px-4 py-3 text-sm ${getApplicationStatusColor(application.status)}`}>
                        {getApplicationStatusText(application.status)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <select
                          className="rounded-md border border-gray-300 p-1"
                          value={application.status}
                          onChange={(e) => updateApplicationStatus(application.id, e.target.value as Application['status'])}
                        >
                          <option value="new">جديد</option>
                          <option value="under_review">قيد المراجعة</option>
                          <option value="interviewed">تمت المقابلة</option>
                          <option value="accepted">مقبول</option>
                          <option value="rejected">مرفوض</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
