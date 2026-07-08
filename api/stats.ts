import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const prismaModule = await import('./_lib/prisma.js');
    const prisma = prismaModule.prisma;

    if (req.method === 'POST') {
      const { visitorId } = req.body;
      if (!visitorId) return res.status(400).json({ message: 'Visitor ID is required' });

      // Upsert visit record (update updatedAt to now)
      await prisma.visit.upsert({
        where: { id: visitorId },
        update: { updatedAt: new Date() },
        create: { id: visitorId }
      });

      return res.status(200).json({ success: true });
    }

    if (req.method === 'GET') {
      // Calculate start of today (in Vietnam timezone GMT+7 roughly, or UTC is fine for simple stats)
      // Let's use UTC+7 for start of today
      const now = new Date();
      
      const startOfDay = new Date(now);
      startOfDay.setUTCHours(17, 0, 0, 0); // 17:00 UTC previous day = 00:00 GMT+7 today
      if (now.getUTCHours() < 17) {
        startOfDay.setDate(startOfDay.getDate() - 1);
      }

      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const [totalVisits, todayVisits, onlineNow] = await Promise.all([
        prisma.visit.count(),
        prisma.visit.count({ where: { updatedAt: { gte: startOfDay } } }),
        prisma.visit.count({ where: { updatedAt: { gte: fiveMinutesAgo } } })
      ]);

      return res.status(200).json({
        totalVisits,
        todayVisits,
        onlineNow: onlineNow > 0 ? onlineNow : 1 // at least 1 (the current user)
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    console.error('Stats API Error:', error);
    return res.status(500).json({ message: 'Internal server error: ' + error.message });
  }
}
