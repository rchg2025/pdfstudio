import type { VercelRequest, VercelResponse } from '@vercel/node';
import loginHandler from './_login.js';
import registerHandler from './_register.js';
import forgotPasswordHandler from './_forgot-password.js';
import googleHandler from './_google.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;

  try {
    switch (action) {
      case 'login':
        return await loginHandler(req, res);
      case 'register':
        return await registerHandler(req, res);
      case 'forgot-password':
        return await forgotPasswordHandler(req, res);
      case 'google':
        return await googleHandler(req, res);
      case 'me': {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
        const token = authHeader.split(' ')[1];
        const jwtModule = await import('jsonwebtoken');
        const jwt = jwtModule.default || jwtModule;
        const secret = process.env.JWT_SECRET || 'fallback_secret_key';
        let decoded: any;
        try {
          decoded = jwt.verify(token, secret);
        } catch {
          return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
        }

        const prismaModule = await import('../_lib/prisma.js');
        const prisma = prismaModule.prisma;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, name: true, role: true }
        });

        if (!user) {
          return res.status(404).json({ message: 'Tài khoản không tồn tại' });
        }

        if (user.role === 'DISABLED') {
          return res.status(403).json({ 
            message: 'Tài khoản của bạn đang bị khóa, vui lòng liên hệ quản trị viên để được hỗ trợ.',
            isBlocked: true 
          });
        }

        return res.status(200).json({ user });
      }
      case 'activate': {
        const email = req.query.email as string;
        const token = req.query.token as string;
        const appUrl = process.env.APP_URL || 'https://tienich.ite.id.vn';

        if (!email || !token) {
          return res.redirect(`${appUrl}/login?activated=error&message=${encodeURIComponent('Thông tin liên kết kích hoạt không hợp lệ.')}`);
        }

        const prismaModule = await import('../_lib/prisma.js');
        const prisma = prismaModule.prisma;

        const otpRecord = await prisma.verificationToken.findFirst({
          where: { 
            email, 
            token, 
            type: { in: ['GOOGLE_REGISTER', 'REGISTER'] } 
          },
          orderBy: { createdAt: 'desc' }
        });

        if (!otpRecord) {
          return res.redirect(`${appUrl}/login?activated=error&message=${encodeURIComponent('Mã kích hoạt không chính xác hoặc đã được sử dụng.')}`);
        }

        if (new Date() > otpRecord.expiresAt) {
          return res.redirect(`${appUrl}/login?activated=error&message=${encodeURIComponent('Liên kết kích hoạt đã hết hạn. Vui lòng đăng ký lại.')}`);
        }

        // Delete used tokens
        await prisma.verificationToken.deleteMany({
          where: { email, type: otpRecord.type }
        });

        // Check if user exists
        let user = await prisma.user.findUnique({ where: { email } });
        let isNew = false;
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: email.split('@')[0],
              role: 'USER'
            }
          });
          isNew = true;
        }

        if (isNew) {
          try {
            const { sendAdminNewUserNotification } = await import('../_lib/email.js');
            await sendAdminNewUserNotification({
              email: user.email,
              name: user.name,
              role: user.role,
              type: otpRecord.type === 'GOOGLE_REGISTER' ? 'GOOGLE' : 'STANDARD'
            });
          } catch (err: any) {
            console.error('Lỗi gửi email thông báo Admin:', err.message);
          }
        }

        return res.redirect(`${appUrl}/login?activated=success&email=${encodeURIComponent(email)}`);
      }
      default:
        return res.status(404).json({ message: 'API Route Not Found' });
    }
  } catch (error: any) {
    console.error('Auth API Error:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
}
