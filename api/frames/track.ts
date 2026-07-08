import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id, action } = req.body;

  if (!id || !action || !['view', 'download'].includes(action)) {
    return res.status(400).json({ message: 'Invalid id or action' });
  }

  try {
    const prismaModule = await import('../_lib/prisma.js');
    const prisma = prismaModule.prisma;

    if (action === 'view') {
      await prisma.frame.update({
        where: { id },
        data: { views: { increment: 1 } }
      });
    } else if (action === 'download') {
      await prisma.frame.update({
        where: { id },
        data: { downloads: { increment: 1 } }
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Frame Track API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
