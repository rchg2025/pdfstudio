import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OAuth2Client } from 'google-auth-library';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ message: 'Credential required' });

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const clientIdSetting = await prisma.setting.findUnique({ where: { key: 'googleClientId' } });
    const clientId = clientIdSetting?.value;
    
    if (!clientId) {
      return res.status(500).json({ message: 'Tính năng đăng nhập Google chưa được cấu hình bởi Admin.' });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Google Token không hợp lệ' });
    }

    const { email, name, sub: googleId } = payload;
    
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { email },
          data: { googleId }
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name,
          googleId,
          role: 'USER'
        }
      });
    }

    const jwtModule = await import('jsonwebtoken');
    const jwt = jwtModule.default || jwtModule;
    const secret = process.env.JWT_SECRET || 'fallback_secret_key';
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Đăng nhập thành công',
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    return res.status(500).json({ message: 'Lỗi xác thực Google: ' + error.message });
  }
}
