import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '../_lib/auth.js';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireAdmin(req);
    const action = req.query?.action || (req as any).params?.action;
    
    if (!action || typeof action !== 'string') {
      return res.status(404).json({ message: 'Action not found' });
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // -------------------------------------------------------------
    // USERS
    // -------------------------------------------------------------
    if (action === 'users') {
      if (req.method === 'GET') {
        const users = await prisma.user.findMany({
          select: { 
            id: true, 
            email: true, 
            name: true, 
            role: true, 
            createdAt: true,
            subscriptionPlan: true,
            subscriptionExpiresAt: true,
            isLifetime: true
          },
          orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json(users);
      }
      if (req.method === 'DELETE') {
        const { id } = req.query;
        if (!id || typeof id !== 'string') return res.status(400).json({ message: 'Invalid ID' });
        await prisma.user.delete({ where: { id } });
        return res.status(200).json({ message: 'User deleted' });
      }
      if (req.method === 'POST') {
        const { email, password, name, role, subscriptionPlan, subscriptionExpiresAt, isLifetime } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ message: 'Email đã tồn tại' });
        const hashedPassword = await bcrypt.hash(password, 10);
        
        let subExp = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const user = await prisma.user.create({
          data: { 
            email, 
            passwordHash: hashedPassword, 
            name, 
            role: role || 'USER',
            subscriptionPlan: subscriptionPlan || 'TRIAL_30D',
            subscriptionExpiresAt: isLifetime ? null : subExp,
            isLifetime: !!isLifetime
          },
          select: { 
            id: true, 
            email: true, 
            name: true, 
            role: true, 
            createdAt: true,
            subscriptionPlan: true,
            subscriptionExpiresAt: true,
            isLifetime: true
          }
        });
        return res.status(201).json(user);
      }
      if (req.method === 'PUT') {
        const { id, email, password, name, role, subscriptionPlan, subscriptionExpiresAt, isLifetime, extendDays } = req.body;
        if (!id) return res.status(400).json({ message: 'Invalid ID' });
        
        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        const dataToUpdate: any = {};
        if (email !== undefined) dataToUpdate.email = email;
        if (name !== undefined) dataToUpdate.name = name;
        if (role !== undefined) dataToUpdate.role = role;
        if (subscriptionPlan !== undefined) dataToUpdate.subscriptionPlan = subscriptionPlan;
        if (isLifetime !== undefined) dataToUpdate.isLifetime = !!isLifetime;
        
        if (password) {
          dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
        }

        if (extendDays !== undefined && Number(extendDays) > 0) {
          const baseDate = (existingUser.subscriptionExpiresAt && new Date(existingUser.subscriptionExpiresAt) > new Date())
            ? new Date(existingUser.subscriptionExpiresAt)
            : new Date();
          dataToUpdate.subscriptionExpiresAt = new Date(baseDate.getTime() + Number(extendDays) * 24 * 60 * 60 * 1000);
          dataToUpdate.isLifetime = false;
        } else if (subscriptionExpiresAt !== undefined) {
          dataToUpdate.subscriptionExpiresAt = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null;
        }

        const user = await prisma.user.update({
          where: { id },
          data: dataToUpdate,
          select: { 
            id: true, 
            email: true, 
            name: true, 
            role: true, 
            createdAt: true,
            subscriptionPlan: true,
            subscriptionExpiresAt: true,
            isLifetime: true
          }
        });

        if (extendDays !== undefined && Number(extendDays) > 0) {
          (async () => {
            try {
              const { sendSubscriptionSuccessEmail } = await import('../_lib/email.js');
              await sendSubscriptionSuccessEmail(user, `Gia hạn ${extendDays} ngày`, user.subscriptionExpiresAt, user.isLifetime);
            } catch (err: any) {
              console.error('Lỗi gửi email gia hạn thủ công:', err.message);
            }
          })();
        }

        return res.status(200).json(user);
      }
    }

    // -------------------------------------------------------------
    // FRAMES
    // -------------------------------------------------------------
    if (action === 'frames') {
      if (req.method === 'GET') {
        const frames = await prisma.frame.findMany({
          include: { user: { select: { name: true, email: true } } },
          orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json(frames);
      }
      if (req.method === 'DELETE') {
        const { id } = req.query;
        if (!id || typeof id !== 'string') return res.status(400).json({ message: 'Invalid ID' });
        await prisma.frame.delete({ where: { id } });
        return res.status(200).json({ message: 'Frame deleted' });
      }
      if (req.method === 'PUT') {
        const { id, title, slug, imageUrl } = req.body;
        if (!id) return res.status(400).json({ message: 'Invalid ID' });
        const updated = await prisma.frame.update({
          where: { id },
          data: { title, slug, imageUrl }
        });
        return res.status(200).json(updated);
      }
    }

    // -------------------------------------------------------------
    // SETTINGS
    // -------------------------------------------------------------
    if (action === 'settings') {
      if (req.method === 'GET') {
        const settings = await prisma.setting.findMany();
        return res.status(200).json(settings);
      }
      if (req.method === 'POST') {
        const { settings } = req.body;
        if (!Array.isArray(settings)) return res.status(400).json({ message: 'Settings must be an array' });
        for (const s of settings) {
          await prisma.setting.upsert({
            where: { key: s.key },
            update: { value: String(s.value) },
            create: { key: s.key, value: String(s.value) }
          });
        }
        return res.status(200).json({ message: 'Settings updated successfully' });
      }
    }

    // -------------------------------------------------------------
    // URLS (QR Links)
    // -------------------------------------------------------------
    if (action === 'urls') {
      if (req.method === 'GET') {
        const urls = await prisma.urls.findMany({
          orderBy: { created_at: 'desc' }
        });
        return res.status(200).json(urls);
      }
      if (req.method === 'DELETE') {
        const { id } = req.query;
        if (!id || typeof id !== 'string') return res.status(400).json({ message: 'Invalid ID' });
        await prisma.urls.delete({ where: { id: parseInt(id) } });
        return res.status(200).json({ message: 'URL deleted' });
      }
      if (req.method === 'PUT') {
        const { id, original_url, alias } = req.body;
        if (!id) return res.status(400).json({ message: 'Invalid ID' });
        const updated = await prisma.urls.update({
          where: { id: parseInt(id) },
          data: { original_url, alias }
        });
        return res.status(200).json(updated);
      }
    }

    // -------------------------------------------------------------
    // TEST DRIVE
    // -------------------------------------------------------------
    if (action === 'test-drive') {
      if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
      const { googleDriveFolderId, googleDriveServiceJson } = req.body;
      if (!googleDriveFolderId || !googleDriveServiceJson) return res.status(400).json({ message: 'Thiếu Folder ID hoặc Service Account JSON' });
      
      let credentials;
      try {
        credentials = JSON.parse(googleDriveServiceJson);
      } catch (err) {
        return res.status(400).json({ message: 'Định dạng JSON của Service Account không hợp lệ' });
      }
      const authClient = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
      });
      const drive = google.drive({ version: 'v3', auth: authClient });
      try {
        const file = await drive.files.get({ fileId: googleDriveFolderId, fields: 'id, name, mimeType', supportsAllDrives: true });
        return res.status(200).json({ message: 'Kết nối thành công!', folderName: file.data.name });
      } catch (error: any) {
        return res.status(400).json({ message: 'Không thể truy cập Folder ID. Hãy kiểm tra lại.', error: error.message });
      }
    }

    // -------------------------------------------------------------
    // TEST SMTP
    // -------------------------------------------------------------
    if (action === 'test-smtp') {
      if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
      const { smtpHost, smtpPort, smtpUser, smtpPass } = req.body;
      if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) return res.status(400).json({ message: 'Thiếu thông tin SMTP' });
      
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Number(smtpPort) === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
      try {
        await transporter.verify();
        await transporter.sendMail({
          from: `"RCHG Studio Admin" <${smtpUser}>`,
          to: smtpUser,
          subject: "Kiểm tra kết nối SMTP RCHG Studio",
          text: "Xin chúc mừng! Kết nối SMTP của hệ thống RCHG Studio hoạt động bình thường.",
          html: "<p>Xin chúc mừng! Kết nối <b>SMTP</b> của hệ thống hoạt động bình thường.</p>"
        });
        return res.status(200).json({ message: 'Kết nối thành công! Đã gửi một email kiểm tra.' });
      } catch (error: any) {
        return res.status(400).json({ message: 'Không thể kết nối SMTP.', error: error.message });
      }
    }

    // -------------------------------------------------------------
    // SUBSCRIPTION ORDERS (Quản lý chuyển khoản & Gia hạn)
    // -------------------------------------------------------------
    if (action === 'subscription-orders') {
      if (req.method === 'GET') {
        const orders = await prisma.subscriptionOrder.findMany({
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                subscriptionPlan: true,
                subscriptionExpiresAt: true,
                isLifetime: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        return res.status(200).json(orders);
      }

      // Xử lý duyệt hoặc từ chối đơn chuyển khoản
      if (req.method === 'PUT') {
        const { id, status, note } = req.body;
        if (!id || !status) {
          return res.status(400).json({ message: 'Thiếu id hoặc status' });
        }

        const order = await prisma.subscriptionOrder.findUnique({
          where: { id },
          include: { user: true }
        });

        if (!order) {
          return res.status(404).json({ message: 'Không tìm thấy đơn gia hạn' });
        }

        if (status === 'APPROVED') {
          // Kích hoạt gói cho user
          const currentUser = order.user;
          const isLifetime = order.planDays >= 99999 || order.planKey === 'plan_lifetime';

          let newExpiresAt: Date | null = null;
          let newPlan = order.planKey.toUpperCase();

          if (!isLifetime) {
            // Nếu user hiện tại còn hạn dùng thì cộng dồn từ ngày hết hạn cũ, ngược lại cộng từ bây giờ
            const baseDate = (currentUser.subscriptionExpiresAt && new Date(currentUser.subscriptionExpiresAt) > new Date())
              ? new Date(currentUser.subscriptionExpiresAt)
              : new Date();
            newExpiresAt = new Date(baseDate.getTime() + order.planDays * 24 * 60 * 60 * 1000);
          }

          // Cập nhật User
          await prisma.user.update({
            where: { id: order.userId },
            data: {
              subscriptionPlan: newPlan,
              subscriptionExpiresAt: isLifetime ? null : newExpiresAt,
              isLifetime: isLifetime
            }
          });

          // Cập nhật Order
          const updatedOrder = await prisma.subscriptionOrder.update({
            where: { id },
            data: { status: 'APPROVED', note: note || order.note }
          });

          // Gửi email thông báo gia hạn thành công cho người dùng
          (async () => {
            try {
              const { sendSubscriptionSuccessEmail } = await import('../_lib/email.js');
              await sendSubscriptionSuccessEmail(currentUser, order.planTitle, newExpiresAt, isLifetime);
            } catch (err: any) {
              console.error('Lỗi khi gửi email thông báo gia hạn thành công:', err.message);
            }
          })();

          return res.status(200).json({
            message: 'Đã phê duyệt đơn và kích hoạt gia hạn thành công cho người dùng!',
            order: updatedOrder
          });
        }

        if (status === 'REJECTED') {
          const updatedOrder = await prisma.subscriptionOrder.update({
            where: { id },
            data: { status: 'REJECTED', note: note || order.note }
          });
          return res.status(200).json({
            message: 'Đã từ chối đơn gia hạn',
            order: updatedOrder
          });
        }

        return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
      }

      if (req.method === 'DELETE') {
        const { id } = req.query;
        if (!id || typeof id !== 'string') return res.status(400).json({ message: 'Invalid ID' });
        await prisma.subscriptionOrder.delete({ where: { id } });
        return res.status(200).json({ message: 'Đã xóa đơn gia hạn' });
      }
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    console.error('Admin API Error:', error);
    return res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
}
