import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireAdmin(req);
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

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

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
}
