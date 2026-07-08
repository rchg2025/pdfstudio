import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Sử dụng Dynamic Imports để ngăn lỗi sập Server ngay lúc khởi động (Boot Crash)
    // Cách này sẽ giúp chúng ta bắt được chính xác thư viện nào đang gây lỗi trên Vercel.
    let PrismaClient, bcrypt, jwt;
    
    try {
      PrismaClient = (await import('@prisma/client')).PrismaClient;
    } catch (e: any) { throw new Error("Lỗi tải Prisma: " + e.message); }
    
    try {
      const bcryptModule = await import('bcryptjs');
      bcrypt = bcryptModule.default || bcryptModule;
    } catch (e: any) { throw new Error("Lỗi tải bcryptjs: " + e.message); }
    
    try {
      const jwtModule = await import('jsonwebtoken');
      jwt = jwtModule.default || jwtModule;
    } catch (e: any) { throw new Error("Lỗi tải jsonwebtoken: " + e.message); }
    
    let prisma;
    try {
      prisma = new PrismaClient();
    } catch (e: any) { throw new Error("Lỗi khởi tạo Prisma DB: " + e.message); }
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(400).json({ message: 'Tài khoản hoặc mật khẩu không chính xác.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Tài khoản hoặc mật khẩu không chính xác.' });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret_key';
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Lỗi chi tiết từ Server: ' + error.message });
  }
}
