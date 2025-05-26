import React, { useState, useEffect, useCallback } from 'react';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService'; // Import authService for logout all
import { Button } from '../ui/button';
import { Input } from '../ui/input'; // For token input
import { useToast } from '../ui/use-toast';
import { Loader2, ShieldCheck, ShieldOff, RefreshCw, Save, LogOut } from 'lucide-react'; // Added LogOut
import { twoFactorAuthUtils } from '../../utils/2fa'; // For QR code generation client-side from otpauth_url

interface TwoFactorAuthSettingsProps {
  userId: string; // Assumes userId is passed as a prop or obtained from auth context
}

const TwoFactorAuthSettings: React.FC<TwoFactorAuthSettingsProps> = ({ userId }) => {
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [setupSecret, setSetupSecret] = useState<string | null>(null); // Base32 secret during setup
  const [verificationToken, setVerificationToken] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // For enable/disable actions
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const { toast } = useToast();

  const fetch2FAStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const userProfile = await userService.getUserProfile(userId);
      setIs2FAEnabled(userProfile?.is_two_factor_enabled || false);
      setQrCodeDataUrl(null); // Reset QR code if status is re-fetched
      setSetupSecret(null);
      setBackupCodes([]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل في تحميل حالة المصادقة الثنائية.';
      setError(msg);
      toast({ title: 'خطأ', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetch2FAStatus();
  }, [fetch2FAStatus]);

  const handleGenerateSecret = async () => {
    setIsProcessing(true);
    setError(null);
    setQrCodeDataUrl(null);
    setBackupCodes([]);
    try {
      // This calls the mocked userService.generateTwoFactorSecret()
      const response = await userService.generateTwoFactorSecret();
      setSetupSecret(response.secret); // Store the base32 secret from the server (mocked)
      if (response.otpauth_url) {
        const qrUrl = await twoFactorAuthUtils.generateQRCodeDataURL(response.otpauth_url);
        setQrCodeDataUrl(qrUrl);
      } else {
        throw new Error('لم يتم إرجاع otpauth_url من الخادم.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل في إنشاء سر المصادقة الثنائية.';
      setError(msg);
      toast({ title: 'خطأ', description: msg, variant: 'destructive' });
      setSetupSecret(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!setupSecret || !verificationToken) {
      setError('الرمز السري أو رمز التحقق مفقود.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      // This calls the mocked userService.enableTwoFactor()
      const response = await userService.enableTwoFactor({ secret: setupSecret, token: verificationToken });
      if (response.success) {
        setIs2FAEnabled(true);
        setBackupCodes(response.backup_codes || []);
        setQrCodeDataUrl(null); // Clear QR after successful setup
        setSetupSecret(null);
        setVerificationToken('');
        toast({ title: 'نجاح', description: 'تم تمكين المصادقة الثنائية بنجاح.' });
      } else {
        throw new Error('رمز التحقق غير صحيح.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل في تمكين المصادقة الثنائية.';
      setError(msg);
      toast({ title: 'خطأ', description: msg, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('هل أنت متأكد أنك تريد تعطيل المصادقة الثنائية؟')) return;
    setIsProcessing(true);
    setError(null);
    try {
      // This calls the mocked userService.disableTwoFactor()
      const response = await userService.disableTwoFactor();
      if (response.success) {
        setIs2FAEnabled(false);
        setQrCodeDataUrl(null);
        setSetupSecret(null);
        setBackupCodes([]);
        toast({ title: 'نجاح', description: 'تم تعطيل المصادقة الثنائية.' });
      } else {
        throw new Error('فشل في تعطيل المصادقة الثنائية.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل في تعطيل المصادقة الثنائية.';
      setError(msg);
      toast({ title: 'خطأ', description: msg, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleRegenerateBackupCodes = async () => {
    if (!window.confirm('هل أنت متأكد أنك تريد إنشاء رموز احتياطية جديدة؟ سيتم إبطال الرموز القديمة.')) return;
    setIsProcessing(true);
    setError(null);
    try {
      const response = await userService.regenerateBackupCodes();
      if (response.success && response.backup_codes) {
        setBackupCodes(response.backup_codes);
        toast({ title: 'نجاح', description: 'تم إنشاء رموز احتياطية جديدة بنجاح.' });
      } else {
        throw new Error('فشل في إنشاء رموز احتياطية جديدة.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل في إنشاء رموز احتياطية جديدة.';
      setError(msg);
      toast({ title: 'خطأ', description: msg, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleLogoutAllDevices = async () => {
    if (!window.confirm('هل أنت متأكد أنك تريد تسجيل الخروج من جميع الأجهزة الأخرى؟ ستحتاج إلى تسجيل الدخول مرة أخرى على هذا الجهاز أيضًا.')) return;
    setIsLoggingOutAll(true);
    setError(null);
    try {
      const result = await authService.logoutFromAllWindows(); // Ensure this is the correct service method
      if (result.success) {
        toast({ title: 'نجاح', description: 'تم تسجيل الخروج من جميع الأجهزة بنجاح. سيتم تسجيل خروجك من هذا الجهاز قريبًا.' });
        // The actual logout from the current device will be handled by onAuthStateChange 
        // or by forcing a redirect after a short delay if needed.
        // For immediate effect, can call local logout too, but global should handle it.
        // await authService.logout(); // Optionally force local logout
      } else {
        throw result.error || new Error('فشل تسجيل الخروج من جميع الأجهزة.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل في تنفيذ تسجيل الخروج من جميع الأجهزة.';
      setError(msg);
      toast({ title: 'خطأ', description: msg, variant: 'destructive' });
    } finally {
      setIsLoggingOutAll(false);
    }
  };


  if (isLoading) {
    return <div className="p-4 flex items-center justify-center"><Loader2 className="mr-2 h-6 w-6 animate-spin" /> جاري تحميل إعدادات الأمان...</div>;
  }

  return (
    <div className="p-4 md:p-6 bg-white shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-4">إعدادات المصادقة الثنائية (2FA)</h2>
      
      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">خطأ: {error}</p>}

      {is2FAEnabled === null && !isLoading && <p>جاري تحميل الحالة...</p>}
      
      {is2FAEnabled === true && (
        <div className="space-y-4 mb-6 p-4 border border-green-200 bg-green-50 rounded-md">
          <div className="flex items-center">
            <ShieldCheck className="h-6 w-6 text-green-600 mr-2" />
            <p className="text-green-700 font-medium">المصادقة الثنائية ممكّنة حاليًا.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleDisable2FA} variant="destructive" disabled={isProcessing || isLoggingOutAll}>
              {isProcessing && !isLoggingOutAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldOff className="mr-2 h-4 w-4" />}
              تعطيل المصادقة الثنائية
            </Button>
            <Button onClick={handleRegenerateBackupCodes} variant="outline" size="sm" disabled={isProcessing || isLoggingOutAll}>
              {isProcessing && !isLoggingOutAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              إنشاء رموز احتياطية جديدة
            </Button>
          </div>
          
          {backupCodes.length > 0 && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <h3 className="font-medium mb-2 text-gray-800">الرموز الاحتياطية الخاصة بك:</h3>
              <ul className="grid grid-cols-2 gap-2">
                {backupCodes.map(code => <li key={code} className="font-mono bg-white p-1.5 border rounded text-sm text-gray-700 tracking-wider">{code}</li>)}
              </ul>
              <p className="text-xs text-gray-600 mt-2">احفظ هذه الرموز في مكان آمن. ستستخدمها إذا فقدت الوصول إلى تطبيق المصادقة.</p>
            </div>
          )}
        </div>
      )}

      {is2FAEnabled === false && !qrCodeDataUrl && (
        <div className="space-y-3 mb-6 p-4 border border-blue-200 bg-blue-50 rounded-md">
           <div className="flex items-center">
             <ShieldOff className="h-6 w-6 text-blue-600 mr-2" />
             <p className="text-blue-700 font-medium">المصادقة الثنائية ليست ممكّنة.</p>
           </div>
          <Button onClick={handleGenerateSecret} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            تمكين المصادقة الثنائية
          </Button>
        </div>
      )}

      {qrCodeDataUrl && setupSecret && !is2FAEnabled && (
        <div className="my-6 p-4 border rounded-md">
          <h3 className="text-lg font-semibold mb-3">إعداد المصادقة الثنائية:</h3>
          <ol className="list-decimal list-inside space-y-2 mb-4 text-sm text-gray-700">
            <li>قم بتثبيت تطبيق مصادقة (مثل Google Authenticator, Authy, etc.) على هاتفك.</li>
            <li>امسح رمز QR التالي باستخدام التطبيق:</li>
          </ol>
          
          <div className="flex justify-center my-4">
            <img src={qrCodeDataUrl} alt="QR Code for 2FA setup" className="border p-1 rounded-md" />
          </div>
          <p className="text-sm text-gray-600 mb-1">أو أدخل هذا الرمز يدويًا في تطبيق المصادقة:</p>
          <p className="font-mono bg-gray-100 p-2 rounded text-center text-sm text-gray-800 tracking-wider my-2">{setupSecret}</p>
          
          <div className="mt-4 space-y-2">
            <Label htmlFor="verificationToken" className="font-medium">أدخل رمز التحقق من تطبيق المصادقة:</Label>
            <Input
              id="verificationToken"
              type="text"
              value={verificationToken}
              onChange={(e) => setVerificationToken(e.target.value.trim())}
              placeholder="123456"
              maxLength={6}
              className="max-w-xs text-center tracking-widest"
              dir="ltr"
            />
            <Button onClick={handleEnable2FA} disabled={isProcessing || verificationToken.length !== 6}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              تفعيل وحفظ
            </Button>
          </div>
           <Button onClick={() => { setQrCodeDataUrl(null); setSetupSecret(null); setError(null); }} variant="link" className="mt-4 text-sm">
            إلغاء الإعداد
          </Button>
        </div>
      )}

      {/* Session Management Section */}
      <div className="mt-8 pt-6 border-t">
        <h3 className="text-lg font-semibold mb-3">إدارة الجلسات</h3>
        <div className="space-y-3 p-4 border rounded-md bg-gray-50">
          <div>
            <p className="text-sm text-gray-700 mb-1">
              يتم إنهاء صلاحية الجلسات تلقائيًا بعد فترة. يمكنك أيضًا تسجيل الخروج من جميع الأجهزة الأخرى يدويًا.
            </p>
            <p className="text-xs text-gray-500">
              (ملاحظة: رموز الوصول الحالية على الأجهزة الأخرى قد تظل صالحة لمدة تصل إلى ساعة واحدة بعد هذا الإجراء.)
            </p>
          </div>
          <Button onClick={handleLogoutAllDevices} variant="outline" disabled={isLoggingOutAll || isProcessing}>
            {isLoggingOutAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
            تسجيل الخروج من جميع الأجهزة الأخرى
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuthSettings;
