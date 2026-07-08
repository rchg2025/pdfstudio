import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const setting = await prisma.setting.findUnique({ where: { key: 'googleClientId' } });
    const clientId = setting?.value || '';
    
    return res.status(200).json({ clientId });
  } catch (error: any) {
    console.error('Google Config API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
