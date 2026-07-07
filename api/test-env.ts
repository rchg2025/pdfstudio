import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Chỉ kiểm tra sự tồn tại của biến môi trường, tuyệt đối không in ra giá trị để bảo mật.
  const envStatus = {
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? '✅ Đã cấu hình' : '❌ Đang thiếu',
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? '✅ Đã cấu hình' : '❌ Đang thiếu',
    JWT_SECRET: process.env.JWT_SECRET ? '✅ Đã cấu hình' : '❌ Đang thiếu',
  };
  
  const isAllSet = Object.values(envStatus).every(val => val.includes('✅'));

  let dbStatus = 'Chưa kiểm tra';
  let dbError = null;

  if (isAllSet) {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.user.count();
      dbStatus = '✅ Kết nối DB thành công';
    } catch (error: any) {
      dbStatus = '❌ Lỗi kết nối DB';
      dbError = error.message;
    }
  }

  res.status(200).json({
    success: isAllSet && dbStatus.includes('✅'),
    message: isAllSet 
      ? 'Hệ thống đã nhận đủ 3 đoạn Key của bạn.' 
      : 'Vẫn còn biến môi trường bị thiếu, hãy kiểm tra lại trên Vercel Dashboard (tab Environment Variables).',
    details: envStatus,
    dbStatus,
    dbError
  });
}
