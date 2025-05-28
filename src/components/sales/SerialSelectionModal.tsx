import React, { useState, useEffect, useCallback } from 'react';
import { Product, SerialNumber } from '../../types';
import { serialNumberService } from '../../services/serialNumberService';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area'; // Assuming ScrollArea is available
import { useToast } from '../ui/use-toast';
import { Loader2 } from 'lucide-react';

interface SerialSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSerials: (selectedSerials: string[]) => void;
  product: Product | null;
  requiredQuantity: number;
  previouslySelectedSerials?: string[];
}

export const SerialSelectionModal: React.FC<SerialSelectionModalProps> = ({
  isOpen,
  onClose,
  onSaveSerials,
  product,
  requiredQuantity,
  previouslySelectedSerials = [],
}) => {
  const [availableSerials, setAvailableSerials] = useState<SerialNumber[]>([]);
  const [selectedSerials, setSelectedSerials] = useState<Set<string>>(new Set(previouslySelectedSerials));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAvailableSerials = useCallback(async () => {
    if (!product || !product.is_serial_tracked) return;

    setIsLoading(true);
    setError(null);
    try {
      const serials = await serialNumberService.getSerialNumbersForProduct(product.id, 'in_stock');
      // Filter out any serials that might be in previouslySelectedSerials but are no longer 'in_stock'
      // or add them to the list if they are selected but not in 'in_stock' (e.g. if editing an existing sale before it's saved)
      // For a new selection, this mainly ensures we only show truly available ones.
      const availableAndValid = serials.filter(sn => sn.status === 'in_stock');
      setAvailableSerials(availableAndValid);

      // Ensure previously selected are still valid and part of the available list, or keep them if they were pre-selected
      const validPreviouslySelected = new Set<string>();
      previouslySelectedSerials.forEach(psn => {
        if (serials.find(s => s.serial_number === psn && s.status === 'in_stock') || availableAndValid.find(s => s.serial_number === psn)) {
          validPreviouslySelected.add(psn);
        }
      });
      // If some previously selected are not in stock anymore, notify user
      if (previouslySelectedSerials.length > validPreviouslySelected.size) {
          toast({
              title: "تنبيه",
              description: "بعض الأرقام التسلسلية المحددة مسبقًا لم تعد متوفرة في المخزون وتمت إزالتها.",
              variant: "warning"
          });
      }
      setSelectedSerials(validPreviouslySelected);

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل في تحميل الأرقام التسلسلية المتاحة.';
      setError(msg);
      toast({ title: 'خطأ', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [product, toast, previouslySelectedSerials]);

  useEffect(() => {
    if (isOpen && product) {
      fetchAvailableSerials();
    } else if (!isOpen) {
      // Reset when modal is closed
      setAvailableSerials([]);
      setSelectedSerials(new Set());
      setError(null);
    }
  }, [isOpen, product, fetchAvailableSerials]);
  
   useEffect(() => {
    // Re-initialize selectedSerials when previouslySelectedSerials prop changes while modal is open
    if (isOpen) {
        setSelectedSerials(new Set(previouslySelectedSerials));
    }
  }, [previouslySelectedSerials, isOpen]);


  const handleToggleSerial = (serialNumber: string) => {
    const newSelection = new Set(selectedSerials);
    if (newSelection.has(serialNumber)) {
      newSelection.delete(serialNumber);
    } else {
      if (newSelection.size < requiredQuantity) {
        newSelection.add(serialNumber);
      } else {
        toast({
          title: 'تنبيه',
          description: `لا يمكنك اختيار أكثر من ${requiredQuantity} رقم تسلسلي.`,
          variant: 'warning',
        });
      }
    }
    setSelectedSerials(newSelection);
  };

  const handleSave = () => {
    if (selectedSerials.size !== requiredQuantity) {
      toast({
        title: 'خطأ في التحقق',
        description: `يجب اختيار ${requiredQuantity} رقم تسلسلي. لقد اخترت ${selectedSerials.size}.`,
        variant: 'destructive',
      });
      return;
    }
    onSaveSerials(Array.from(selectedSerials));
    onClose();
  };

  if (!isOpen || !product) return null;

  const displayedSerials = [...availableSerials];
  // Add any previously selected serials to the list if they aren't already in 'availableSerials' (e.g. if status changed)
  // This ensures they are visible and can be unselected.
  previouslySelectedSerials.forEach(psn => {
    if (!displayedSerials.find(ds => ds.serial_number === psn)) {
        const mockSerial: SerialNumber = { // Mock object for display purposes
            id: Date.now() + Math.random(), // Temporary unique ID for key
            product_id: product.id,
            serial_number: psn,
            status: 'unknown' as SerialNumberStatus, // Indicate it might not be 'in_stock'
            created_at: '',
            updated_at: ''
        };
        displayedSerials.push(mockSerial);
    }
  });


  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-100">
        <h3 className="text-lg font-semibold mb-1 text-gray-800">
          اختر الأرقام التسلسلية للمنتج: {product.name}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          مطلوب: {requiredQuantity} | تم الاختيار: {selectedSerials.size}
        </p>

        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="mr-2 h-8 w-8 animate-spin text-indigo-600" /> <span>جاري تحميل الأرقام...</span>
          </div>
        )}
        {error && !isLoading && <p className="text-red-500 bg-red-100 p-3 rounded my-2">خطأ: {error}</p>}
        
        {!isLoading && !error && displayedSerials.length === 0 && (
            <p className="text-center text-gray-500 py-4">لا توجد أرقام تسلسلية متاحة لهذا المنتج حاليًا.</p>
        )}

        {!isLoading && !error && displayedSerials.length > 0 && (
          <ScrollArea className="h-64 border rounded-md p-2 mb-4">
            <div className="space-y-2">
              {displayedSerials.map((serial) => (
                <div key={serial.id} className={`flex items-center space-x-2 p-2 rounded-md transition-colors ${selectedSerials.has(serial.serial_number) ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                  <Checkbox
                    id={`serial-${serial.id}`}
                    checked={selectedSerials.has(serial.serial_number)}
                    onCheckedChange={() => handleToggleSerial(serial.serial_number)}
                    disabled={serial.status !== 'in_stock' && !previouslySelectedSerials.includes(serial.serial_number)} 
                  />
                  <Label 
                    htmlFor={`serial-${serial.id}`} 
                    className={`flex-1 cursor-pointer text-sm ${serial.status !== 'in_stock' && !previouslySelectedSerials.includes(serial.serial_number) ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                  >
                    {serial.serial_number}
                    {serial.status !== 'in_stock' && !previouslySelectedSerials.includes(serial.serial_number) && <span className="text-xs text-red-500 ml-2">({serial.status})</span>}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="mt-6 flex justify-end space-x-2 space-x-reverse">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || selectedSerials.size !== requiredQuantity}
          >
            حفظ ({selectedSerials.size}/{requiredQuantity})
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SerialSelectionModal;
