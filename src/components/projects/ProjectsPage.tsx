import React from 'react';
import { ProjectList } from './ProjectList';
import { TaskManager } from './TaskManager';
import { CostTracker } from './CostTracker';
import { PageWrapper } from '../layout/PageWrapper';

export function ProjectsPage() {
  return (
    <PageWrapper className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        إدارة المشاريع
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <ProjectList />
        </div>
        <div className="lg:col-span-1">
          <TaskManager />
        </div>
        <div className="lg:col-span-1">
          <CostTracker />
        </div>
      </div>
    </PageWrapper>
  );
}
