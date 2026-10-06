import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  
  const { credential, action, otp, email: tempEmail, name: tempName, googleId: tempGoogleId } = req.body;

  try {
    const prismaModule = await import('../_lib/prisma.js');
    const prisma = prismaModule.prisma;
    
    const clientIdSetting = await prisma.setting.findUnique({ where: { key: 'googleClientId' } });
    const clientId = clientIdSetting?.value;
    
    if (!clientId) {
      return res.status(500).json({ message: 'Tính năng đăng nhập Google chưa được cấu hình bởi Admin.' });
    }

    // Gửi lại mã OTP kích hoạt Google
    if (action === 'RESEND_OTP') {
      if (!tempEmail) {
        return res.status(400).json({ message: 'Thiếu thông tin email' });
      }

      await prisma.verificationToken.deleteMany({ where: { email: tempEmail, type: 'GOOGLE_REGISTER' } });

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      await prisma.verificationToken.create({
        data: {
          email: tempEmail,
          token: generatedOtp,
          type: 'GOOGLE_REGISTER',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        }
      });

      const emailModule = await import('../_lib/email.js');
      await emailModule.sendOtpEmail(tempEmail, generatedOtp, 'GOOGLE_REGISTER');

      return res.status(200).json({ message: 'Đã gửi lại mã kích hoạt đến email của bạn.' });
    }

    // Xác nhận mã OTP kích hoạt tài khoản Google lần đầu
    if (action === 'VERIFY_OTP') {
      if (!otp || !tempEmail || !tempGoogleId) {
        return res.status(400).json({ message: 'Thiếu thông tin xác thực' });
      }

      const otpRecord = await prisma.verificationToken.findFirst({
        where: { email: tempEmail, type: 'GOOGLE_REGISTER', token: otp },
        orderBy: { createdAt: 'desc' }
      });

      if (!otpRecord) return res.status(400).json({ message: 'Mã xác nhận không chính xác' });
      if (new Date() > otpRecord.expiresAt) return res.status(400).json({ message: 'Mã xác nhận đã hết hạn' });

      await prisma.verificationToken.deleteMany({ where: { email: tempEmail, type: 'GOOGLE_REGISTER' } });

      const trialExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 ngày dùng thử miễn phí

      const newUser = await prisma.user.create({
        data: {
          email: tempEmail,
          name: tempName,
          googleId: tempGoogleId,
          role: 'USER',
          subscriptionPlan: 'TRIAL_30D',
          subscriptionExpiresAt: trialExpiresAt,
          isLifetime: false
        }
      });

      // Thông báo cho Quản trị viên (Admin) khi có người dùng mới kích hoạt tài khoản
      try {
        const emailModule = await import('../_lib/email.js');
        await emailModule.sendAdminNewUserNotification({
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          type: 'GOOGLE'
        });
      } catch (notifyErr: any) {
        console.error('Lỗi khi gửi email thông báo Admin:', notifyErr.message);
      }

      const jwtModule = await import('jsonwebtoken');
      const jwt = jwtModule.default || jwtModule;
      const secret = process.env.JWT_SECRET || 'fallback_secret_key';
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email, role: newUser.role },
        secret,
        { expiresIn: '30d' }
      );

      return res.status(201).json({
        message: 'Kích hoạt tài khoản và đăng nhập thành công',
        token,
        user: { 
          id: newUser.id, 
          email: newUser.email, 
          name: newUser.name, 
          role: newUser.role,
          subscriptionPlan: newUser.subscriptionPlan,
          subscriptionExpiresAt: newUser.subscriptionExpiresAt,
          isLifetime: newUser.isLifetime
        }
      });
    }

    if (!credential) return res.status(400).json({ message: 'Credential required' });

    const googleAuthModule = await import('google-auth-library');
    const OAuth2Client = googleAuthModule.OAuth2Client;
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
      if (user.role === 'DISABLED') {
        return res.status(403).json({ message: 'Tài khoản của bạn đang bị khóa, vui lòng liên hệ quản trị viên để được hỗ trợ.' });
      }

      if (!user.googleId) {
        user = await prisma.user.update({
          where: { email },
          data: { googleId }
        });
      }
      
      const jwtModule = await import('jsonwebtoken');
      const jwt = jwtModule.default || jwtModule;
      const secret = process.env.JWT_SECRET || 'fallback_secret_key';
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        secret,
        { expiresIn: '30d' }
      );

      return res.status(200).json({
        message: 'Đăng nhập thành công',
        token,
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role,
          subscriptionPlan: user.subscriptionPlan,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          isLifetime: user.isLifetime
        }
      });
    } else {
      // Người dùng mới chưa có tài khoản: bắt buộc gửi mã xác nhận kích hoạt tài khoản qua email trước khi cho phép đăng nhập lần đầu
      await prisma.verificationToken.deleteMany({ where: { email, type: 'GOOGLE_REGISTER' } });

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 chữ số
      await prisma.verificationToken.create({
        data: {
          email,
          token: generatedOtp,
          type: 'GOOGLE_REGISTER',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 phút
        }
      });

      const emailModule = await import('../_lib/email.js');
      const sendOtpEmail = emailModule.sendOtpEmail;
      await sendOtpEmail(email, generatedOtp, 'GOOGLE_REGISTER');
      
      return res.status(202).json({ 
        message: 'Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email Google của bạn để lấy mã xác nhận kích hoạt tài khoản trước khi đăng nhập lần đầu tiên.', 
        requireOtp: true,
        tempData: { email, name, googleId }
      });
    }
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    return res.status(500).json({ message: 'Lỗi xác thực Google: ' + error.message });
  }
}
