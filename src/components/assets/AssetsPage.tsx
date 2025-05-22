import React from 'react';
import { AssetList } from './AssetList';
import { DepreciationCalculator } from './DepreciationCalculator';
import { MaintenanceManager } from './MaintenanceManager';
import { PageWrapper } from '../layout/PageWrapper';

export function AssetsPage() {
  return (
    <PageWrapper className="p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        إدارة الأصول
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <AssetList />
        </div>
        <div className="lg:col-span-1">
          <DepreciationCalculator />
        </div>
        <div className="lg:col-span-1">
          <MaintenanceManager />
        </div>
      </div>
    </PageWrapper>
  );
}
