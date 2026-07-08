import type { VercelRequest, VercelResponse } from '@vercel/node';


const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-do-not-use-in-production';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { action, email, password, name, otp } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email là bắt buộc' });
  }

  try {
    // -------------------------------------------------------------
    // Bước 1: Gửi OTP đăng ký
    // -------------------------------------------------------------
    if (action === 'SEND_OTP') {
      const prismaModule = await import('../_lib/prisma.js');
      const prisma = prismaModule.prisma || prismaModule.default?.prisma;
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email đã tồn tại trong hệ thống' });
      }

      // Xóa các mã OTP cũ
      await prisma.verificationToken.deleteMany({
        where: { email, type: 'REGISTER' }
      });

      // Tạo OTP mới
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 số
      await prisma.verificationToken.create({
        data: {
          email,
          token: generatedOtp,
          type: 'REGISTER',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 phút
        }
      });

      const emailModule = await import('../_lib/email.js');
      const sendOtpEmail = emailModule.sendOtpEmail;
      await sendOtpEmail(email, generatedOtp, 'REGISTER');
      return res.status(200).json({ message: 'Mã xác nhận đã được gửi đến email của bạn' });
    }

    // -------------------------------------------------------------
    // Bước 2: Xác nhận OTP và tạo tài khoản
    // -------------------------------------------------------------
    if (action === 'VERIFY_OTP') {
      if (!otp || !password) {
        return res.status(400).json({ message: 'Vui lòng điền mã OTP và mật khẩu' });
      }

      const prismaModule = await import('../_lib/prisma.js');
      const prisma = prismaModule.prisma || prismaModule.default?.prisma;
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email đã tồn tại trong hệ thống' });
      }

      const otpRecord = await prisma.verificationToken.findFirst({
        where: { email, type: 'REGISTER', token: otp },
        orderBy: { createdAt: 'desc' }
      });

      if (!otpRecord) {
        return res.status(400).json({ message: 'Mã xác nhận không chính xác' });
      }

      if (new Date() > otpRecord.expiresAt) {
        return res.status(400).json({ message: 'Mã xác nhận đã hết hạn' });
      }

      // Hợp lệ -> Xóa mã OTP và Tạo tài khoản
      await prisma.verificationToken.deleteMany({ where: { email, type: 'REGISTER' } });

      const bcryptModule = await import('bcryptjs');
      const bcrypt = bcryptModule.default || bcryptModule;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          name: name || email.split('@')[0],
          role: 'USER'
        }
      });

      // Tạo token
      const jwtModule = await import('jsonwebtoken');
      const jwt = jwtModule.default || jwtModule;
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.status(201).json({
        message: 'Đăng ký thành công',
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      });
    }

    return res.status(400).json({ message: 'Action không hợp lệ' });

  } catch (error: any) {
    console.error('Register API Error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi máy chủ' });
  }
}
