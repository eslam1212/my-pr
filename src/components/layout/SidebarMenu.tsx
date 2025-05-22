import React from 'react';
    import { 
      LayoutGrid,
      Users, 
      ShoppingCart,
      Package, 
      FileText, 
      DollarSign,
      BarChart3,
      Settings,
      Database,
      Home,
      Truck,
      BookOpen,
      Landmark,
      UserCheck,
      ListChecks,
      UserPlus,
      PercentCircle,
      MapPin,
      Banknote
    } from 'lucide-react';
    
    interface MenuItem {
      path: string;
      label: string;
      icon: React.ElementType;
    }
    
    export const menuItems: MenuItem[] = [
      { path: '/', label: 'لوحة التحكم', icon: Home },
      { path: '/contacts', label: 'العملاء والموردين', icon: Users },
      { path: '/sales', label: 'المبيعات', icon: ShoppingCart },
      { path: '/purchases', label: 'المشتريات', icon: Truck },
      { path: '/inventory', label: 'المخزون', icon: Package },
      { path: '/invoices', label: 'الفواتير', icon: FileText },
      { path: '/finance', label: 'المالية', icon: DollarSign },
      { path: '/reports', label: 'التقارير', icon: BarChart3 },
      { path: '/settings', label: 'الإعدادات', icon: Settings },
      { path: '/accounting', label: 'الحسابات', icon: BookOpen },
      { path: '/assets', label: 'الأصول', icon: Landmark },
      { path: '/hr', label: 'الموارد البشرية', icon: UserCheck },
      { path: '/projects', label: 'المشاريع', icon: ListChecks },
      { path: '/crm', label: 'إدارة العملاء', icon: UserPlus },
      { path: '/banking', label: 'البنوك', icon: Banknote },
      { path: '/tax', label: 'الضرائب', icon: PercentCircle },
      { path: '/branches', label: 'الفروع', icon: LayoutGrid },
      { path: '/shipping', label: 'الشحن', icon: MapPin },
      { path: '/backup', label: 'النسخ الاحتياطي', icon: Database },
    ];
