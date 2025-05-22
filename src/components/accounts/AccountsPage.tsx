import React, { useState } from 'react';
import { GeneralLedger } from './GeneralLedger';
import { ExpenseManager } from './ExpenseManager';
import { RevenueManager } from './RevenueManager';
import { BudgetPlanner } from './BudgetPlanner';
import { Menu, X } from 'lucide-react';
import { PageWrapper } from '../layout/PageWrapper';

const sections = [
  { id: 'general', label: 'دفتر الأستاذ العام' },
  { id: 'expense', label: 'إدارة المصروفات' },
  { id: 'revenue', label: 'إدارة الإيرادات' },
  { id: 'budget', label: 'مخطط الميزانية' }
] as const;

type SectionType = typeof sections[number]['id'];

export function AccountsPage() {
  const [activeSection, setActiveSection] = useState<SectionType>('general');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSectionChange = (section: SectionType) => {
    setActiveSection(section);
    setIsMobileMenuOpen(false);
  };

  return (
    <PageWrapper className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">إدارة الحسابات</h1>
                <p className="mt-1 text-sm text-gray-600">
                  إدارة الحسابات والميزانيات والمصروفات
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                  إضافة معاملة
                </button>
                <button className="flex-1 sm:flex-none px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                  تصدير التقرير
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6">
          {/* Mobile Menu Button */}
          <div className="sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex justify-between items-center"
            >
              <span>{sections.find(section => section.id === activeSection)?.label}</span>
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-gray-400" />
              ) : (
                <Menu className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
              <div className="mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => handleSectionChange(section.id)}
                    className={`w-full text-right px-4 py-3 text-sm transition-colors duration-150 ${
                      activeSection === section.id
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:block">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 space-x-reverse overflow-x-auto" aria-label="Tabs">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => handleSectionChange(section.id)}
                    className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${
                      activeSection === section.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6">
              {activeSection === 'general' && <GeneralLedger />}
              {activeSection === 'expense' && <ExpenseManager />}
              {activeSection === 'revenue' && <RevenueManager />}
              {activeSection === 'budget' && <BudgetPlanner />}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
