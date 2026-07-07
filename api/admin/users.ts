import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireAdmin(req);
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

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

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    console.error('Admin Users API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
