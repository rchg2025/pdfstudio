
export async function sendOtpEmail(to: string, otp: string, type: 'REGISTER' | 'RESET_PASSWORD' | 'GOOGLE_REGISTER') {
  const prismaModule = await import('./prisma.js');
  const prisma = prismaModule.prisma;

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
    throw new Error('Hệ thống chưa cấu hình Email (SMTP). Vui lòng liên hệ Quản trị viên.');
  }

  const nodemailerModule = await import('nodemailer');
  const nodemailer = nodemailerModule.default || nodemailerModule;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const appUrl = process.env.APP_URL || 'https://tienich.ite.id.vn';
  const activateUrl = `${appUrl}/api/auth/activate?email=${encodeURIComponent(to)}&token=${encodeURIComponent(otp)}`;

  let subject = '';
  let title = '';
  let description = '';
  let showActivationButton = false;

  if (type === 'REGISTER') {
    subject = 'Mã xác nhận kích hoạt tài khoản - RCHG Studio';
    title = 'Xác Nhận Kích Hoạt Tài Khoản';
    description = 'Cảm ơn bạn đã đăng ký tài khoản tại RCHG Studio. Dưới đây là mã xác nhận (OTP) để hoàn tất kích hoạt tài khoản. Bạn cũng có thể bấm nút kích hoạt trực tiếp bên dưới:';
    showActivationButton = true;
  } else if (type === 'RESET_PASSWORD') {
    subject = 'Mã xác nhận lấy lại mật khẩu - RCHG Studio';
    title = 'Lấy Lại Mật Khẩu';
    description = 'Bạn đã yêu cầu lấy lại mật khẩu tại RCHG Studio. Dưới đây là mã xác nhận (OTP) của bạn. Nếu bạn không yêu cầu, vui lòng bỏ qua email này.';
    showActivationButton = false;
  } else if (type === 'GOOGLE_REGISTER') {
    subject = 'Xác nhận kích hoạt tài khoản đăng ký bằng Google - RCHG Studio';
    title = 'Kích Hoạt Tài Khoản Google';
    description = 'Bạn vừa đăng ký tài khoản tại RCHG Studio thông qua tài khoản Google. Để kích hoạt tài khoản trước khi cho phép đăng nhập lần đầu tiên, vui lòng nhập mã xác nhận 6 số bên dưới hoặc nhấn nút kích hoạt trực tiếp:';
    showActivationButton = true;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; }
  .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 0.5px; font-weight: 700; }
  .content { padding: 40px 32px; text-align: center; }
  .content p { color: #475569; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 24px; text-align: left; }
  .otp-box { background: #f8fafc; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; margin: 24px 0; }
  .otp-code { font-size: 38px; font-weight: 800; color: #4f46e5; letter-spacing: 8px; margin: 0; font-family: monospace; }
  .btn-activate { display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff !important; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 8px; text-decoration: none; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); margin: 8px 0 20px; }
  .footer { background: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; }
  .footer p { color: #94a3b8; font-size: 13px; margin: 0; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>RCHG Studio</h1>
    </div>
    <div class="content">
      <h2 style="color: #1e293b; font-size: 20px; margin-top: 0; margin-bottom: 16px;">${title}</h2>
      <p>${description}</p>
      
      <div class="otp-box">
        <p style="text-align: center; margin-bottom: 8px; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Mã kích hoạt của bạn (OTP)</p>
        <h1 class="otp-code">${otp}</h1>
      </div>

      ${showActivationButton ? `
      <div style="margin: 24px 0 16px; text-align: center;">
        <a href="${activateUrl}" class="btn-activate" target="_blank">
          👉 Bấm Vào Đây Để Kích Hoạt Tài Khoản
        </a>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 8px;">(Hoặc nhập mã số OTP ở trên vào cửa sổ đăng ký của bạn)</div>
      </div>
      ` : ''}
      
      <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-bottom: 0; margin-top: 16px;">
        Mã xác nhận này sẽ hết hạn trong vòng 15 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.
      </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} RCHG Studio &bull; Tiện ích giáo dục & đào tạo trực tuyến</p>
    </div>
  </div>
</body>
</html>
  `;

  await transporter.sendMail({
    from: `"RCHG Studio" <${user}>`,
    to,
    subject,
    html
  });
}

/**
 * Gửi email thông báo cho Quản trị viên (Admin) khi có người dùng mới đăng ký thành công
 */
export async function sendAdminNewUserNotification(newUser: {
  email: string;
  name?: string | null;
  role: string;
  type?: 'GOOGLE' | 'STANDARD';
}) {
  const prismaModule = await import('./prisma.js');
  const prisma = prismaModule.prisma;

  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'adminNotificationEmail'] } }
    });

    const getSetting = (k: string) => settings.find(s => s.key === k)?.value || '';
    
    const host = getSetting('smtpHost');
    const port = Number(getSetting('smtpPort')) || 587;
    const user = getSetting('smtpUser');
    const pass = getSetting('smtpPass');
    const adminNotificationEmail = getSetting('adminNotificationEmail');

    if (!host || !user || !pass) {
      console.warn('Bỏ qua gửi email thông báo Admin vì hệ thống chưa cấu hình SMTP.');
      return;
    }

    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true }
    });

    const recipientSet = new Set<string>();

    if (adminNotificationEmail) {
      adminNotificationEmail.split(',').map(e => e.trim()).filter(Boolean).forEach(e => recipientSet.add(e));
    }

    adminUsers.forEach(u => {
      if (u.email && u.email.includes('@')) recipientSet.add(u.email);
    });

    if (recipientSet.size === 0 && user && user.includes('@')) {
      recipientSet.add(user);
    }

    if (recipientSet.size === 0) {
      console.warn('Không tìm thấy địa chỉ email admin nào để gửi thông báo.');
      return;
    }

    const recipients = Array.from(recipientSet);

    const nodemailerModule = await import('nodemailer');
    const nodemailer = nodemailerModule.default || nodemailerModule;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const timeStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const methodStr = newUser.type === 'GOOGLE' ? 'Đăng ký bằng Google OAuth' : 'Đăng ký thông thường (Email & Mật khẩu)';

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
  .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 28px 24px; text-align: center; color: #ffffff; }
  .header h1 { margin: 0; font-size: 22px; font-weight: 700; }
  .badge { display: inline-block; background: #ecfdf5; color: #047857; font-weight: 700; font-size: 13px; padding: 4px 12px; border-radius: 9999px; margin-top: 10px; border: 1px solid #a7f3d0; }
  .content { padding: 32px 28px; }
  .table { width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; }
  .table td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #e2e8f0; }
  .table tr:last-child td { border-bottom: none; }
  .label { font-weight: 600; color: #64748b; width: 35%; }
  .val { color: #1e293b; font-weight: 600; }
  .btn { display: inline-block; background: #2563eb; color: #ffffff !important; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 15px; }
  .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Thông Báo Người Dùng Mới</h1>
      <span class="badge">Đã Kích Hoạt Thành Công</span>
    </div>
    <div class="content">
      <p style="font-size: 15px; color: #334155; margin-top: 0;">
        Kính gửi Quản trị viên, hệ thống vừa ghi nhận một tài khoản người dùng mới đã đăng ký và kích hoạt tài khoản thành công:
      </p>

      <table class="table">
        <tr>
          <td class="label">Họ và tên:</td>
          <td class="val">${newUser.name || 'Chưa cung cấp'}</td>
        </tr>
        <tr>
          <td class="label">Email:</td>
          <td class="val"><strong style="color: #2563eb;">${newUser.email}</strong></td>
        </tr>
        <tr>
          <td class="label">Hình thức:</td>
          <td class="val">${methodStr}</td>
        </tr>
        <tr>
          <td class="label">Vai trò ban đầu:</td>
          <td class="val"><span style="background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${newUser.role}</span></td>
        </tr>
        <tr>
          <td class="label">Thời gian:</td>
          <td class="val">${timeStr}</td>
        </tr>
      </table>

      <div style="text-align: center; margin-top: 24px;">
        <a href="https://tienich.ite.id.vn/admin" class="btn" target="_blank">
          Truy cập Trang Quản Trị Hệ Thống →
        </a>
      </div>
    </div>
    <div class="footer">
      Email tự động được gửi từ hệ thống RCHG Studio &bull; ${new Date().getFullYear()}
    </div>
  </div>
</body>
</html>
    `;

    await transporter.sendMail({
      from: `"RCHG Studio - Quản Trị" <${user}>`,
      to: recipients.join(', '),
      subject: `[RCHG Studio] Người dùng mới đăng ký: ${newUser.name || newUser.email}`,
      html
    });

    console.log(`Đã gửi email thông báo đăng ký người dùng mới tới admin: ${recipients.join(', ')}`);
  } catch (err: any) {
    console.error('Lỗi khi gửi email thông báo admin:', err.message);
  }
}

