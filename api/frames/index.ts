import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../_lib/auth.js';
import { google } from 'googleapis';
import { Readable } from 'stream';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = requireAuth(req);
    const prismaModule = await import('../_lib/prisma.js');
    const prisma = prismaModule.prisma;

    if (req.method === 'GET') {
      const frames = await prisma.frame.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(frames);
    }

    if (req.method === 'POST') {
      let { title, slug, imageUrls } = req.body;
      if (!title || (!imageUrls || imageUrls.length === 0)) {
        return res.status(400).json({ message: 'Title and imageUrls are required' });
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

      // imageUrls is already an array of drive URLs from the client's sequential upload
      let finalImageUrl = '[]';
      if (Array.isArray(imageUrls)) {
        finalImageUrl = JSON.stringify(imageUrls);
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
