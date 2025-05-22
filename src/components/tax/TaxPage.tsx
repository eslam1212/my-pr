import React from 'react';
import { TaxCalculator } from './TaxCalculator';
import { TaxReports } from './TaxReports';
import { PageWrapper } from '../layout/PageWrapper';

export function TaxPage() {
  return (
    <PageWrapper className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        إدارة الضرائب
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <TaxCalculator />
        </div>
        <div className="lg:col-span-1">
          <TaxReports />
        </div>
      </div>
    </PageWrapper>
  );
}
