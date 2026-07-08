import type { VercelRequest, VercelResponse } from '@vercel/node';


export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { action, email, otp, newPassword } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email là bắt buộc' });
  }

  try {
    // -------------------------------------------------------------
    // Bước 1: Gửi OTP quên mật khẩu
    // -------------------------------------------------------------
    if (action === 'SEND_OTP') {
      const prismaModule = await import('../_lib/prisma.js');
      const prisma = prismaModule.prisma;
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (!existingUser) {
        return res.status(400).json({ message: 'Email không tồn tại trong hệ thống' });
      }

      // Xóa các mã OTP cũ
      await prisma.verificationToken.deleteMany({
        where: { email, type: 'RESET_PASSWORD' }
      });

      // Tạo OTP mới
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 số
      await prisma.verificationToken.create({
        data: {
          email,
          token: generatedOtp,
          type: 'RESET_PASSWORD',
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 phút
        }
      });

      const emailModule = await import('../_lib/email.js');
      const sendOtpEmail = emailModule.sendOtpEmail;
      await sendOtpEmail(email, generatedOtp, 'RESET_PASSWORD');
      return res.status(200).json({ message: 'Mã xác nhận đã được gửi đến email của bạn' });
    }

    // -------------------------------------------------------------
    // Bước 2: Xác nhận OTP và đặt lại mật khẩu
    // -------------------------------------------------------------
    if (action === 'VERIFY_OTP') {
      if (!otp || !newPassword) {
        return res.status(400).json({ message: 'Vui lòng điền mã OTP và mật khẩu mới' });
      }

      const prismaModule = await import('../_lib/prisma.js');
      const prisma = prismaModule.prisma;
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (!existingUser) {
        return res.status(400).json({ message: 'Email không tồn tại trong hệ thống' });
      }

      const otpRecord = await prisma.verificationToken.findFirst({
        where: { email, type: 'RESET_PASSWORD', token: otp },
        orderBy: { createdAt: 'desc' }
      });

      if (!otpRecord) {
        return res.status(400).json({ message: 'Mã xác nhận không chính xác' });
      }

      if (new Date() > otpRecord.expiresAt) {
        return res.status(400).json({ message: 'Mã xác nhận đã hết hạn' });
      }

      // Hợp lệ -> Xóa mã OTP và Đổi mật khẩu
      await prisma.verificationToken.deleteMany({ where: { email, type: 'RESET_PASSWORD' } });

      const bcryptModule = await import('bcryptjs');
      const bcrypt = bcryptModule.default || bcryptModule;
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { email },
        data: { passwordHash: hashedPassword }
      });

      return res.status(200).json({ message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' });
    }

    return res.status(400).json({ message: 'Action không hợp lệ' });

  } catch (error: any) {
    console.error('Forgot Password API Error:', error);
    return res.status(500).json({ message: error.message || 'Lỗi máy chủ' });
  }
}
