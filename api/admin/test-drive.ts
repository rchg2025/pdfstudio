import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/auth.js';
import { google } from 'googleapis';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireAdmin(req);
    
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { googleDriveFolderId, googleDriveServiceJson } = req.body;

    if (!googleDriveFolderId || !googleDriveServiceJson) {
      return res.status(400).json({ message: 'Thiếu Folder ID hoặc Service Account JSON' });
    }

    let credentials;
    try {
      credentials = JSON.parse(googleDriveServiceJson);
    } catch (err) {
      return res.status(400).json({ message: 'Định dạng JSON của Service Account không hợp lệ' });
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Kiểm tra quyền truy cập vào Folder ID
    try {
      const file = await drive.files.get({
        fileId: googleDriveFolderId,
        fields: 'id, name, mimeType',
        supportsAllDrives: true,
      });

      return res.status(200).json({ 
        message: 'Kết nối thành công!', 
        folderName: file.data.name 
      });
    } catch (error: any) {
      console.error('Google Drive API Error:', error);
      return res.status(400).json({ 
        message: 'Không thể truy cập Folder ID. Hãy kiểm tra lại ID hoặc quyền Share Team Drive cho Service Account.',
        error: error.message
      });
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    console.error('Test Drive Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
