import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { originalUrl } = req.body;
  let { customAlias } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ error: 'Thiếu tham số originalUrl' });
  }

  if (!customAlias || customAlias.trim() === '') {
    // Tự động tạo alias ngẫu nhiên 6 ký tự
    customAlias = Math.random().toString(36).substring(2, 8);
  } else {
    customAlias = customAlias.trim();
  }
  
  // Basic URL validation
  try {
    new URL(originalUrl);
  } catch (e) {
    return res.status(400).json({ error: 'URL không hợp lệ' });
  }

  try {
    // Check if alias exists
    const existing = await prisma.urls.findFirst({
      where: {
        alias: {
          equals: customAlias,
          mode: 'insensitive'
        }
      }
    });

    if (existing) {
      return res.status(409).json({ error: 'Đuôi tùy chỉnh này đã tồn tại, vui lòng chọn tên khác.' });
    }

    // Insert new URL
    await prisma.urls.create({
      data: {
        original_url: originalUrl,
        alias: customAlias
      }
    });
    
    return res.status(200).json({ success: true, alias: customAlias });
  } catch (error: any) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lưu URL' });
  }
}
