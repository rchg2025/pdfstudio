import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../_lib/auth.js';
import { google } from 'googleapis';
import { Readable } from 'stream';
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = requireAuth(req);
    const prismaModule = await import('../_lib/prisma.js');
    const prisma = prismaModule.prisma;

    if (req.method === 'POST') {
      const { imageBase64, filename } = req.body;
      if (!imageBase64 || !imageBase64.startsWith('data:image')) {
        return res.status(400).json({ message: 'Invalid imageBase64 data' });
      }

      const settings = await prisma.setting.findMany({
        where: { key: { in: ['googleDriveFolderId', 'googleDriveServiceJson'] } }
      });
      const folderIdSetting = settings.find((s: any) => s.key === 'googleDriveFolderId');
      const serviceJsonSetting = settings.find((s: any) => s.key === 'googleDriveServiceJson');

      if (!folderIdSetting?.value || !serviceJsonSetting?.value) {
        return res.status(500).json({ message: 'Lỗi hệ thống: Chưa cấu hình Google Drive trong Admin.' });
      }

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
          const search = await drive.files.list({ q: query, spaces: 'drive', supportsAllDrives: true, includeItemsFromAllDrives: true, corpora: 'allDrives' });
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

        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        const safeFilename = filename || `upload-${Date.now()}.png`;

        const fileMetadata = {
          name: safeFilename,
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

        return res.status(200).json({ url: `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000` });
      } catch (err: any) {
        console.error("Google Drive Upload Error:", err);
        return res.status(500).json({ message: 'Lỗi khi upload ảnh lên Google Drive: ' + err.message });
      }
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ message: 'Unauthorized' });
    console.error('Upload API Error:', error);
    return res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
}
