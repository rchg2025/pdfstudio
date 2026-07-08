import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const prismaModule = await import('../_lib/prisma.js');
    const prisma = prismaModule.prisma;

    // Get top 10 newest
    const newestFrames = await prisma.frame.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        imageUrl: true,
        views: true,
        downloads: true,
        user: { select: { name: true } }
      }
    });

    // Get top 10 most downloaded
    const topDownloadedFrames = await prisma.frame.findMany({
      take: 10,
      orderBy: { downloads: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        imageUrl: true,
        views: true,
        downloads: true,
        user: { select: { name: true } }
      }
    });

    return res.status(200).json({
      newest: newestFrames,
      topDownloaded: topDownloadedFrames
    });
  } catch (error) {
    console.error('Public Frames API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
