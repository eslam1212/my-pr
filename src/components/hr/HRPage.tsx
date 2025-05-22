import React from 'react';
import { Payroll } from './Payroll';
import { Attendance } from './Attendance';
import { LeaveManager } from './LeaveManager';
import { EmployeeList } from './EmployeeList';
import { RecruitmentManager } from './RecruitmentManager';
import { PageWrapper } from '../layout/PageWrapper';

export function HRPage() {
  return (
    <PageWrapper className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        إدارة الموارد البشرية
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <Payroll />
        </div>
        <div className="lg:col-span-1">
          <Attendance />
        </div>
        <div className="lg:col-span-1">
          <LeaveManager />
        </div>
        <div className="lg:col-span-1">
          <EmployeeList />
        </div>
        <div className="lg:col-span-1">
          <RecruitmentManager />
        </div>
      </div>
    </PageWrapper>
  );
}
