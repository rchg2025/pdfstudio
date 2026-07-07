import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = requireAuth(req);

    if (req.method === 'GET') {
      const frames = await prisma.frame.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(frames);
    }

    if (req.method === 'POST') {
      const { title, slug, imageUrl } = req.body;
      if (!title || !slug || !imageUrl) {
        return res.status(400).json({ message: 'Title, slug, and imageUrl are required' });
      }

      // Check if slug exists
      const existing = await prisma.frame.findUnique({ where: { slug } });
      if (existing) {
        return res.status(400).json({ message: 'Đường dẫn (slug) này đã được sử dụng. Vui lòng chọn đường dẫn khác.' });
      }

      const newFrame = await prisma.frame.create({
        data: {
          title,
          slug,
          imageUrl,
          userId: user.userId
        }
      });
      return res.status(201).json(newFrame);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ message: 'Unauthorized' });
    console.error('Frame API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
