import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../_lib/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    requireAdmin(req);
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    if (req.method === 'GET') {
      const settings = await prisma.setting.findMany();
      return res.status(200).json(settings);
    }

    if (req.method === 'POST') {
      const { settings } = req.body;
      if (!Array.isArray(settings)) {
        return res.status(400).json({ message: 'Settings must be an array' });
      }

      for (const s of settings) {
        await prisma.setting.upsert({
          where: { key: s.key },
          update: { value: String(s.value) },
          create: { key: s.key, value: String(s.value) }
        });
      }
      return res.status(200).json({ message: 'Settings updated successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    console.error('Admin Settings API Error:', error);
    return res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
}
