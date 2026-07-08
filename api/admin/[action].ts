import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '../_lib/auth.js';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireAdmin(req);
    const { action } = req.query;
    
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
          select: { id: true, email: true, name: true, role: true, createdAt: true },
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
        const { email, password, name, role } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ message: 'Email đã tồn tại' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
          data: { email, passwordHash: hashedPassword, name, role: role || 'USER' },
          select: { id: true, email: true, name: true, role: true, createdAt: true }
        });
        return res.status(201).json(user);
      }
      if (req.method === 'PUT') {
        const { id, email, password, name, role } = req.body;
        if (!id) return res.status(400).json({ message: 'Invalid ID' });
        const dataToUpdate: any = { email, name, role };
        if (password) dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.update({
          where: { id },
          data: dataToUpdate,
          select: { id: true, email: true, name: true, role: true, createdAt: true }
        });
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
          from: `"PDF Studio Admin" <${smtpUser}>`,
          to: smtpUser,
          subject: "Kiểm tra kết nối SMTP PDF Studio",
          text: "Xin chúc mừng! Kết nối SMTP của hệ thống PDF Studio hoạt động bình thường.",
          html: "<p>Xin chúc mừng! Kết nối <b>SMTP</b> của hệ thống hoạt động bình thường.</p>"
        });
        return res.status(200).json({ message: 'Kết nối thành công! Đã gửi một email kiểm tra.' });
      } catch (error: any) {
        return res.status(400).json({ message: 'Không thể kết nối SMTP.', error: error.message });
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
