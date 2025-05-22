import React from 'react';
import { LeadManager } from './LeadManager';
import { ContactManager } from './ContactManager';
import { DealTracker } from './DealTracker';
import { CustomerManager } from './CustomerManager';
import { PageWrapper } from '../layout/PageWrapper';

export function CRMPage() {
  return (
    <PageWrapper className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        إدارة العملاء
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <LeadManager />
        </div>
        <div className="lg:col-span-1">
          <ContactManager />
        </div>
        <div className="lg:col-span-1">
          <DealTracker />
        </div>
         <div className="lg:col-span-1">
          <CustomerManager />
        </div>
      </div>
    </PageWrapper>
  );
}
