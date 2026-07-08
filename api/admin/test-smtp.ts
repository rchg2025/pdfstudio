import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/auth.js';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireAdmin(req);
    
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { smtpHost, smtpPort, smtpUser, smtpPass } = req.body;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin SMTP' });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    try {
      await transporter.verify();
      
      // Gửi mail test
      await transporter.sendMail({
        from: `"PDF Studio Admin" <${smtpUser}>`,
        to: smtpUser,
        subject: "Kiểm tra kết nối SMTP PDF Studio",
        text: "Xin chúc mừng! Kết nối SMTP của hệ thống PDF Studio hoạt động bình thường.",
        html: "<p>Xin chúc mừng! Kết nối <b>SMTP</b> của hệ thống PDF Studio hoạt động bình thường.</p>"
      });

      return res.status(200).json({ 
        message: 'Kết nối thành công! Đã gửi một email kiểm tra tới hộp thư của bạn.'
      });
    } catch (error: any) {
      console.error('SMTP Connection Error:', error);
      return res.status(400).json({ 
        message: 'Không thể kết nối SMTP. Vui lòng kiểm tra lại Host, Port hoặc Mật khẩu ứng dụng.',
        error: error.message
      });
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    console.error('Test SMTP Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
