import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '../lib/prisma';
import { requireAdmin } from '../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireAdmin(req);

    if (req.method === 'GET') {
      const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(users);
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
