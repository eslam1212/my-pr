import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { InventoryProvider } from './contexts/InventoryContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { App } from './App';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { InventoryPage } from './components/inventory/InventoryPage';
import { ContactsPage } from './components/contacts/ContactsPage';
import { UserManagement } from './components/users/UserManagement';
import { SalesPage } from './components/sales/SalesPage';
import { PurchasesPage } from './components/purchases/PurchasesPage';
import { FinancePage } from './components/finance/FinancePage';
import { InvoicesPage } from './components/invoices/InvoicesPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { Accounting } from './components/accounts/Accounting';
import { AssetsPage } from './components/assets/AssetsPage';
import { HRPage } from './components/hr/HRPage';
import { ProjectsPage } from './components/projects/ProjectsPage';
import { CRMPage } from './components/crm/CRMPage';
import { BankingPage } from './components/banking/BankingPage';
import { TaxPage } from './components/tax/TaxPage';
import { BranchManager } from './components/branches/BranchManager';
import { ShippingManager } from './components/shipping/ShippingManager';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    ),
  },
  {
    path: '/',
    element: (
      <AuthProvider>
        <CurrencyProvider>
          <InventoryProvider>
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          </InventoryProvider>
        </CurrencyProvider>
      </AuthProvider>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            index: true,
            element: <DashboardPage />
          },
          {
            path: 'dashboard',
            element: <DashboardPage />
          },
          {
            path: 'inventory',
            element: <InventoryPage />
          },
          {
            path: 'contacts',
            element: <ContactsPage />
          },
          {
            path: 'users',
            element: <UserManagement />
          },
          {
            path: 'sales',
            element: <SalesPage />
          },
          {
            path: 'purchases',
            element: <PurchasesPage />
          },
          {
            path: 'finance',
            element: <FinancePage />
          },
          {
            path: 'invoices',
            element: <InvoicesPage />
          },
          {
            path: 'reports',
            element: <ReportsPage />
          },
          {
            path: 'settings',
            element: <SettingsPage />
          },
          {
            path: 'accounting',
            element: <Accounting />
          },
          {
            path: 'assets',
            element: <AssetsPage />
          },
          {
            path: 'hr',
            element: <HRPage />
          },
          {
            path: 'projects',
            element: <ProjectsPage />
          },
          {
            path: 'crm',
            element: <CRMPage />
          },
          {
            path: 'banking',
            element: <BankingPage />
          },
          {
            path: 'tax',
            element: <TaxPage />
          },
          {
            path: 'branches',
            element: <BranchManager />
          },
          {
            path: 'shipping',
            element: <ShippingManager />
          }
        ]
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
