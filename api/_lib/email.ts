
export async function sendOtpEmail(to: string, otp: string, type: 'REGISTER' | 'RESET_PASSWORD' | 'GOOGLE_REGISTER') {
  const prismaModule = await import('./prisma.js');
  const prisma = prismaModule.prisma || prismaModule.default?.prisma;

  // Fetch SMTP settings
  const settings = await prisma.setting.findMany({
    where: { key: { in: ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPass'] } }
  });

  const getSetting = (k: string) => settings.find(s => s.key === k)?.value || '';
  
  const host = getSetting('smtpHost');
  const port = Number(getSetting('smtpPort')) || 587;
  const user = getSetting('smtpUser');
  const pass = getSetting('smtpPass');

  if (!host || !user || !pass) {
    throw new Error('Hệ thống chưa cấu hình Email (SMTP). Vui lòng liên hệ Admin.');
  }

  const nodemailerModule = await import('nodemailer');
  const nodemailer = nodemailerModule.default || nodemailerModule;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  let subject = '';
  let title = '';
  let description = '';

  if (type === 'REGISTER') {
    subject = 'Mã xác nhận đăng ký tài khoản - RCHG Studio';
    title = 'Xác nhận Đăng ký';
    description = 'Cảm ơn bạn đã đăng ký tài khoản tại RCHG Studio. Dưới đây là mã xác nhận (OTP) của bạn. Vui lòng không chia sẻ mã này cho bất kỳ ai.';
  } else if (type === 'RESET_PASSWORD') {
    subject = 'Mã xác nhận lấy lại mật khẩu - RCHG Studio';
    title = 'Lấy lại Mật khẩu';
    description = 'Bạn đã yêu cầu lấy lại mật khẩu tại RCHG Studio. Dưới đây là mã xác nhận (OTP) của bạn. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.';
  } else if (type === 'GOOGLE_REGISTER') {
    subject = 'Mã xác nhận đăng ký bằng Google - RCHG Studio';
    title = 'Xác nhận Đăng ký Google';
    description = 'Bạn đang tiến hành đăng nhập lần đầu bằng Google. Dưới đây là mã xác nhận (OTP) để hoàn tất việc đăng ký. Vui lòng không chia sẻ mã này.';
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
  .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 32px 24px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 0.5px; }
  .content { padding: 40px 32px; text-align: center; }
  .content p { color: #475569; font-size: 16px; line-height: 1.6; margin-top: 0; margin-bottom: 24px; text-align: left; }
  .otp-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; margin: 32px 0; }
  .otp-code { font-size: 40px; font-weight: 700; color: #1d4ed8; letter-spacing: 8px; margin: 0; }
  .footer { background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; }
  .footer p { color: #94a3b8; font-size: 14px; margin: 0; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>RCHG Studio</h1>
    </div>
    <div class="content">
      <h2 style="color: #1e293b; font-size: 20px; margin-top: 0; margin-bottom: 24px;">${title}</h2>
      <p>${description}</p>
      
      <div class="otp-box">
        <p style="text-align: center; margin-bottom: 12px; color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase;">Mã xác nhận của bạn</p>
        <h1 class="otp-code">${otp}</h1>
      </div>
      
      <p style="font-size: 14px; color: #64748b; text-align: center; margin-bottom: 0;">Mã này sẽ hết hạn trong vòng 10 phút.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} RCHG Studio. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;

  await transporter.sendMail({
    from: \`"RCHG Studio" <\${user}>\`,
    to,
    subject,
    html
  });
}
