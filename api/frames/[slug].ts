import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../_lib/prisma.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { slug } = req.query;
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ message: 'Slug is required' });
  }

  try {
    const frame = await prisma.frame.findUnique({
      where: { slug },
      include: {
        user: { select: { name: true } }
      }
    });

    if (!frame) {
      return res.status(404).json({ message: 'Frame not found' });
    }

    return res.status(200).json(frame);
  } catch (error) {
    console.error('Frame fetch error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
