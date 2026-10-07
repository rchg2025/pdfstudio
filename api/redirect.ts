import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from './_lib/prisma.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let alias = (req.query?.alias as string || (req as any).params?.alias || '').trim();
  
  if (!alias) {
    return res.redirect(302, '/');
  }

  // Loại bỏ dấu gạch chéo cuối nếu có
  alias = alias.replace(/\/$/, '');

  try {
    const record = await prisma.urls.findFirst({
      where: {
        alias: {
          equals: alias,
          mode: 'insensitive'
        }
      }
    });

    if (record) {
      // Tăng lượt click bất đồng bộ
      prisma.urls.update({
        where: { id: record.id },
        data: { clicks: { increment: 1 } }
      }).catch(err => console.error('Error updating clicks:', err));

      // 301 Permanent Redirect to original url
      return res.redirect(301, record.original_url);
    } else {
      return res.redirect(302, '/?error=notfound');
    }
  } catch (error) {
    console.error('Database error during redirect:', error);
    return res.redirect(302, '/');
  }
}
