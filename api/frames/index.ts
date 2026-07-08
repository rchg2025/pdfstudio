import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../_lib/auth.js';
import { google } from 'googleapis';
import { Readable } from 'stream';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = requireAuth(req);
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    if (req.method === 'GET') {
      const frames = await prisma.frame.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(frames);
    }

    if (req.method === 'POST') {
      let { title, slug, imageUrl } = req.body;
      if (!title || !imageUrl) {
        return res.status(400).json({ message: 'Title and imageUrl are required' });
      }

      if (!slug) {
        slug = Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 6);
        let existing = await prisma.frame.findUnique({ where: { slug } });
        while (existing) {
          slug = Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 6);
          existing = await prisma.frame.findUnique({ where: { slug } });
        }
      } else {
        const existing = await prisma.frame.findUnique({ where: { slug } });
        if (existing) {
          return res.status(400).json({ message: 'Đường dẫn (slug) này đã được sử dụng. Vui lòng chọn đường dẫn khác.' });
        }
      }

      let finalImageUrl = imageUrl;

      // Handle Base64 upload to Google Drive
      if (imageUrl.startsWith('data:image')) {
        const settings = await prisma.setting.findMany({
          where: { key: { in: ['googleDriveFolderId', 'googleDriveServiceJson'] } }
        });
        const folderIdSetting = settings.find((s: any) => s.key === 'googleDriveFolderId');
        const serviceJsonSetting = settings.find((s: any) => s.key === 'googleDriveServiceJson');

        if (!folderIdSetting?.value || !serviceJsonSetting?.value) {
          return res.status(500).json({ message: 'Lỗi hệ thống: Chưa cấu hình Google Drive trong Admin.' });
        }

        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        try {
          const credentials = JSON.parse(serviceJsonSetting.value);
          const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
          });
          const drive = google.drive({ version: 'v3', auth });

          const now = new Date();
          const yearStr = now.getFullYear().toString();
          const monthStr = (now.getMonth() + 1).toString().padStart(2, '0');

          // Helper to find or create folder
          const getOrCreateFolder = async (name: string, parentId: string) => {
            const query = `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
            const search = await drive.files.list({ q: query, spaces: 'drive', supportsAllDrives: true, includeItemsFromAllDrives: true });
            if (search.data.files && search.data.files.length > 0) {
              return search.data.files[0].id!;
            }
            const created = await drive.files.create({
              requestBody: { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] },
              supportsAllDrives: true,
            });
            return created.data.id!;
          };

          const yearFolderId = await getOrCreateFolder(yearStr, folderIdSetting.value);
          const monthFolderId = await getOrCreateFolder(monthStr, yearFolderId);

          const fileMetadata = {
            name: `${slug}-${Date.now()}.png`,
            parents: [monthFolderId],
          };

          const media = {
            mimeType: 'image/png',
            body: stream,
          };

          const uploadedFile = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id',
            supportsAllDrives: true,
          });

          const fileId = uploadedFile.data.id!;

          // Set public permission
          await drive.permissions.create({
            fileId: fileId,
            requestBody: { role: 'reader', type: 'anyone' },
            supportsAllDrives: true,
          });

          finalImageUrl = `https://drive.google.com/uc?id=${fileId}`;
        } catch (err: any) {
          console.error("Google Drive Upload Error:", err);
          return res.status(500).json({ message: 'Lỗi khi upload ảnh lên Google Drive: ' + err.message });
        }
      }

      const newFrame = await prisma.frame.create({
        data: {
          title,
          slug,
          imageUrl: finalImageUrl,
          userId: user.userId
        }
      });
      return res.status(201).json(newFrame);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id || typeof id !== 'string') return res.status(400).json({ message: 'Invalid ID' });
      
      // Ensure the frame belongs to the user
      const existing = await prisma.frame.findUnique({ where: { id } });
      if (!existing || existing.userId !== user.userId) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      await prisma.frame.delete({ where: { id } });
      return res.status(200).json({ message: 'Frame deleted' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ message: 'Unauthorized' });
    console.error('Frame API Error:', error);
    return res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
}
