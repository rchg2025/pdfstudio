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
      default:
        return res.status(404).json({ message: 'API Route Not Found' });
    }
  } catch (error: any) {
    console.error('Auth API Error:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
}
