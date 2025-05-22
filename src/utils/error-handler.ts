export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleDatabaseError(error: any): never {
  if (error?.message?.includes('JWT expired')) {
    throw new AppError('انتهت صلاحية الجلسة، يرجى إعادة تسجيل الدخول');
  }
  
  if (error?.code === '42501') {
    throw new AppError('ليس لديك الصلاحية للقيام بهذه العملية');
  }

  if (error?.message?.includes('Failed to fetch')) {
    throw new AppError('فشل الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت');
  }

  throw new AppError(error?.message || 'حدث خطأ غير متوقع');
}
