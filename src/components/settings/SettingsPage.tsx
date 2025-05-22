import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useSettingsStore } from '@/store/settingsStore';
import { Settings, Globe, Palette, CreditCard, CalendarDays, Save, Loader2, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/lib/supabase';

export function SettingsPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("interface");
  
  const {
    direction,
    language,
    theme,
    currency,
    dateFormat,
    setDirection,
    setLanguage,
    setTheme,
    setCurrency,
    setDateFormat,
    syncSettings,
    applySettings,
    setUserId
  } = useSettingsStore();

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Get current user
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id || 'anonymous';
      
      // Set user ID in store
      setUserId(userId);
      
      // Sync settings to database
      await syncSettings();
      
      // Apply settings immediately
      applySettings();
      
      toast({
        title: 'تم حفظ الإعدادات',
        description: 'تم تطبيق التغييرات بنجاح',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'خطأ في حفظ الإعدادات',
        description: 'حدث خطأ أثناء حفظ الإعدادات، يرجى المحاولة مرة أخرى',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">إعدادات النظام</h1>
          <p className="text-muted-foreground mt-1">قم بتخصيص إعدادات النظام حسب تفضيلاتك</p>
        </div>
        <Button 
          onClick={handleSave} 
          size="lg" 
          className="gap-2 w-full sm:w-auto"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              حفظ الإعدادات
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6">
          <TabsTrigger value="interface" className="gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">الواجهة</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">المظهر</span>
          </TabsTrigger>
          <TabsTrigger value="currency" className="gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">العملة</span>
          </TabsTrigger>
          <TabsTrigger value="date" className="gap-2">
            <CalendarDays className="w-4 h-4" />
            <span className="hidden sm:inline">التاريخ</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="interface" className="space-y-6">
          <Card className="shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">تخصيص الواجهة</CardTitle>
              </div>
              <CardDescription>اختر اتجاه عرض التطبيق ولغة الواجهة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold">اتجاه العرض</Label>
                <RadioGroup 
                  value={direction} 
                  onValueChange={(value: 'rtl' | 'ltr') => setDirection(value)}
                  className="bg-muted/50 p-4 rounded-lg space-y-3"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="rtl" id="rtl" />
                    <Label htmlFor="rtl" className="text-sm font-medium cursor-pointer">من اليمين إلى اليسار</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="ltr" id="ltr" />
                    <Label htmlFor="ltr" className="text-sm font-medium cursor-pointer">من اليسار إلى اليمين</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold">لغة النظام</Label>
                <RadioGroup 
                  value={language} 
                  onValueChange={(value: 'ar' | 'en') => setLanguage(value)}
                  className="bg-muted/50 p-4 rounded-lg space-y-3"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="ar" id="ar" />
                    <Label htmlFor="ar" className="text-sm font-medium cursor-pointer">العربية</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="en" id="en" />
                    <Label htmlFor="en" className="text-sm font-medium cursor-pointer">الإنجليزية</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card className="shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">المظهر</CardTitle>
              </div>
              <CardDescription>اختر سمة التطبيق المفضلة لديك</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label className="text-base font-semibold">سمة النظام</Label>
                <RadioGroup 
                  value={theme} 
                  onValueChange={(value: 'light' | 'dark' | 'system') => setTheme(value)}
                  className="bg-muted/50 p-4 rounded-lg space-y-3"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light" className="text-sm font-medium cursor-pointer">فاتح</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark" className="text-sm font-medium cursor-pointer">داكن</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system" className="text-sm font-medium cursor-pointer">حسب النظام</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="currency" className="space-y-6">
          <Card className="shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">العملة</CardTitle>
              </div>
              <CardDescription>اختر العملة الافتراضية للنظام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label className="text-base font-semibold">العملة الافتراضية</Label>
                <RadioGroup 
                  value={currency} 
                  onValueChange={(value: 'SAR' | 'USD' | 'EGP') => setCurrency(value)}
                  className="bg-muted/50 p-4 rounded-lg space-y-3"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="SAR" id="sar" />
                    <Label htmlFor="sar" className="text-sm font-medium cursor-pointer">ريال سعودي (ر.س)</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="USD" id="usd" />
                    <Label htmlFor="usd" className="text-sm font-medium cursor-pointer">دولار أمريكي ($)</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="EGP" id="egp" />
                    <Label htmlFor="egp" className="text-sm font-medium cursor-pointer">جنيه مصري (ج.م)</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="date" className="space-y-6">
          <Card className="shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                <CardTitle className="text-xl">تنسيق التاريخ</CardTitle>
              </div>
              <CardDescription>اختر تنسيق عرض التواريخ في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label className="text-base font-semibold">تنسيق التاريخ</Label>
                <RadioGroup 
                  value={dateFormat} 
                  onValueChange={(value: 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd') => setDateFormat(value)}
                  className="bg-muted/50 p-4 rounded-lg space-y-3"
                >
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="dd/MM/yyyy" id="dmy" />
                    <Label htmlFor="dmy" className="text-sm font-medium cursor-pointer">يوم/شهر/سنة (31/12/2024)</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="MM/dd/yyyy" id="mdy" />
                    <Label htmlFor="mdy" className="text-sm font-medium cursor-pointer">شهر/يوم/سنة (12/31/2024)</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="yyyy-MM-dd" id="ymd" />
                    <Label htmlFor="ymd" className="text-sm font-medium cursor-pointer">سنة-شهر-يوم (2024-12-31)</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 bg-muted/30 p-4 rounded-lg border border-muted">
        <div className="flex items-start gap-3">
          <div className="bg-green-100 text-green-800 p-1.5 rounded-full">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-medium text-sm">ملاحظة حول الإعدادات</h3>
            <p className="text-muted-foreground text-sm mt-1">
              سيتم تطبيق الإعدادات على جميع صفحات النظام فور حفظها. كما سيتم حفظها في قاعدة البيانات لاستخدامها في المرات القادمة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
