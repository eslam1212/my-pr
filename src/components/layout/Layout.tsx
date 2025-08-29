import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PageWrapper } from './PageWrapper';
import { Toaster } from '../../components/ui/toaster';

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  return (
    <PageWrapper className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto bg-slate-100 p-4">
          <Outlet />
        </main>
      </div>
      
      <Toaster />
    </PageWrapper>
  );
} 