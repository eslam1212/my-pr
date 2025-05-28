import React, { useState, useEffect, useCallback } from 'react';
import { Product, StorageLocation, ProductStockLevel } from '../../types';
import { productService } from '../../services/product.service';
import { storageLocationService } from '../../services/storageLocationService';
// Assume inventoryService or a new productStockLevelService will have a method 
// like upsertProductStockLevelSettings(productId, locationId, reorderLevel, preferredStockLevel, currentQuantity?)
// For now, we'll mock this interaction or use a conceptual direct DB update via a helper.
import { supabase } from '../../lib/supabase'; // For direct DB interaction as a placeholder
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '../ui/use-toast';
import { PageWrapper } from '../layout/PageWrapper';
import { Settings, ListFilter, Save, Loader2 } from 'lucide-react';

interface LocationProductSetting extends Partial<ProductStockLevel> {
  product_id: number;
  product_name: string;
  location_id: string; // Will be set by selectedLocation
  current_quantity: number; // To display current stock
}

const LocationProductStockSettingsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [settings, setSettings] = useState<LocationProductSetting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [prods, locs] = await Promise.all([
          productService.getAll(),
          storageLocationService.getAll(),
        ]);
        setProducts(prods);
        setLocations(locs);
        if (locs.length > 0) {
          // setSelectedLocationId(locs[0].id); // Auto-select first location
        }
      } catch (error) {
        toast({ title: "خطأ", description: "فشل في تحميل البيانات.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const fetchStockLevelsForLocation = useCallback(async (locationId: string) => {
    if (!locationId) {
        setSettings([]);
        return;
    }
    setIsLoading(true);
    try {
      // Fetch existing product_stock_levels for this location
      const { data: existingLevels, error } = await supabase
        .from('product_stock_levels')
        .select('*, products(name)') // Join with products for name
        .eq('location_id', locationId);

      if (error) throw error;

      // Fetch serial number counts for this location
      const { data: serialCountsData, error: serialError } = await supabase
        .from('serial_numbers')
        .select('product_id, count')
        .eq('location_id', locationId)
        .eq('status', 'in_stock')
        .then(response => ({
            ...response,
            data: response.data?.map(d => ({product_id: d.product_id, count: (d.count as any[])?.length || d.count })) || []
        }));
        
      if (serialError) throw serialError;
      const serialCounts = new Map(serialCountsData?.map(item => [item.product_id, item.count as number]) || []);


      const locationSettings = products.map(p => {
        const existing = existingLevels?.find(lvl => lvl.product_id === p.id);
        let currentQuantity = 0;
        if (p.is_serial_tracked) {
            currentQuantity = serialCounts.get(p.id) || 0;
        } else {
            currentQuantity = existing?.quantity || 0;
        }

        return {
          product_id: p.id,
          product_name: p.name,
          location_id: locationId,
          reorder_level: existing?.reorder_level ?? p.reorder_level ?? 0,
          preferred_stock_level: existing?.preferred_stock_level ?? p.preferred_stock_level ?? 0,
          current_quantity: currentQuantity,
          // We don't set 'quantity' here as this form is for reorder/preferred levels, not current stock count.
        };
      });
      setSettings(locationSettings);
    } catch (error: any) {
      toast({ title: "خطأ", description: `فشل في تحميل مستويات المخزون للموقع: ${error.message}`, variant: "destructive" });
      setSettings([]);
    } finally {
      setIsLoading(false);
    }
  }, [products, toast]);

  useEffect(() => {
    if (selectedLocationId) {
      fetchStockLevelsForLocation(selectedLocationId);
    } else {
      setSettings([]); // Clear settings if no location is selected
    }
  }, [selectedLocationId, fetchStockLevelsForLocation]);


  const handleSettingChange = (productId: number, field: 'reorder_level' | 'preferred_stock_level', value: string) => {
    const numericValue = parseInt(value, 10);
    if (isNaN(numericValue) || numericValue < 0) return; // Basic validation

    setSettings(prevSettings =>
      prevSettings.map(s =>
        s.product_id === productId ? { ...s, [field]: numericValue } : s
      )
    );
  };

  const handleSaveAllSettingsForLocation = async () => {
    if (!selectedLocationId) {
      toast({ title: "خطأ", description: "يرجى اختيار موقع أولاً.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const upsertData = settings
        .filter(s => typeof s.reorder_level === 'number' || typeof s.preferred_stock_level === 'number') // Only upsert if levels are set
        .map(s => ({
          product_id: s.product_id,
          location_id: selectedLocationId,
          reorder_level: s.reorder_level ?? 0, // Default to 0 if undefined
          preferred_stock_level: s.preferred_stock_level ?? 0, // Default to 0 if undefined
          // quantity is not managed here, it's managed by actual stock movements.
          // If a record doesn't exist, upsert might create it with quantity 0 if DB default is 0.
          // Or select current quantity and include it. For now, focusing on levels.
        }));

      if (upsertData.length === 0) {
        toast({ title: "لا تغييرات", description: "لم يتم إجراء أي تغييرات على المستويات.", variant: "info" });
        setIsSaving(false);
        return;
      }
      
      // This is a placeholder for what should ideally be a single batch upsert call
      // to an inventoryService method, e.g., inventoryService.batchUpdateProductStockLevelSettings(upsertData)
      // The service method would then handle the upsert logic against product_stock_levels.
      const { error } = await supabase
        .from('product_stock_levels')
        .upsert(upsertData, { onConflict: 'product_id, location_id' });

      if (error) throw error;

      toast({ title: "نجاح", description: "تم حفظ إعدادات مستوى المخزون للموقع." });
      fetchStockLevelsForLocation(selectedLocationId); // Refresh data
    } catch (error: any) {
      toast({ title: "خطأ", description: `فشل في حفظ الإعدادات: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <PageWrapper className="p-4 md:p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
          <Settings className="h-6 w-6 ml-2 text-indigo-600" /> إعدادات مستويات المخزون للمواقع
        </h1>
      </div>

      <div className="mb-6 p-4 bg-white shadow rounded-lg">
        <Label htmlFor="locationSelect" className="block text-lg font-medium text-gray-700 mb-2">اختر موقع التخزين:</Label>
        <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
          <SelectTrigger id="locationSelect" className="w-full md:w-1/2">
            <SelectValue placeholder="اختر موقعًا لعرض/تعديل إعداداته..." />
          </SelectTrigger>
          <SelectContent>
            {locations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedLocationId && (
        <>
          {isLoading && <div className="text-center p-4"><Loader2 className="h-6 w-6 animate-spin inline-block" /> جاري تحميل البيانات...</div>}
          {!isLoading && settings.length === 0 && <p className="text-center text-gray-500 py-4">لا توجد منتجات لعرض الإعدادات لها أو لم يتم تحميل البيانات.</p>}
          {!isLoading && settings.length > 0 && (
            <div className="bg-white shadow-md rounded-lg">
              <div className="flex justify-between items-center p-4 border-b">
                 <h2 className="text-lg font-semibold">
                    المنتجات في: {locations.find(l=>l.id === selectedLocationId)?.name}
                 </h2>
                <Button onClick={handleSaveAllSettingsForLocation} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />} حفظ الكل لهذا الموقع
                </Button>
              </div>
              <ScrollArea className="h-[calc(100vh-20rem)]"> {/* Adjust height as needed */}
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-right font-medium text-gray-500">المنتج</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500">الكمية الحالية</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500">حد إعادة الطلب (الموقع)</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500">المخزون المفضل (الموقع)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {settings.map((setting, index) => (
                      <tr key={setting.product_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-gray-800">{setting.product_name}</div>
                          <div className="text-xs text-gray-500">ID: {setting.product_id}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-700">{setting.current_quantity}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Input
                            type="number"
                            min="0"
                            value={setting.reorder_level}
                            onChange={(e) => handleSettingChange(setting.product_id, 'reorder_level', e.target.value)}
                            className="w-24 h-8 text-sm"
                            disabled={isSaving}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Input
                            type="number"
                            min="0"
                            value={setting.preferred_stock_level}
                            onChange={(e) => handleSettingChange(setting.product_id, 'preferred_stock_level', e.target.value)}
                            className="w-24 h-8 text-sm"
                            disabled={isSaving}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          )}
        </>
      )}
    </PageWrapper>
  );
};

export default LocationProductStockSettingsPage;
