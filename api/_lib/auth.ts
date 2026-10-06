import type { VercelRequest } from '@vercel/node';
import jwt from 'jsonwebtoken';

export interface DecodedUser {
  userId: string;
  email: string;
  role: string;
}

export function getUserFromRequest(req: VercelRequest): DecodedUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_key';
    const decoded = jwt.verify(token, secret) as DecodedUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function requireAuth(req: VercelRequest): DecodedUser {
  const user = getUserFromRequest(req);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export function requireAdmin(req: VercelRequest): DecodedUser {
  const user = requireAuth(req);
  if (user.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }
  return user;
}

export async function requireActiveSubscription(req: VercelRequest): Promise<DecodedUser> {
  const user = requireAuth(req);
  if (user.role === 'ADMIN') {
    return user; // Quản trị viên luôn có toàn quyền truy cập
  }

  const { prisma } = await import('./prisma.js');
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { 
      id: true, 
      email: true, 
      role: true, 
      isLifetime: true, 
      subscriptionExpiresAt: true,
      subscriptionPlan: true 
    }
  });

  if (!dbUser) {
    throw new Error('Unauthorized');
  }

  if (dbUser.role === 'DISABLED') {
    throw new Error('DISABLED_ACCOUNT');
  }

  // Nếu là gói vĩnh viễn
  if (dbUser.isLifetime) {
    return user;
  }

  // Kiểm tra ngày hết hạn
  if (dbUser.subscriptionExpiresAt) {
    const now = new Date();
    if (new Date(dbUser.subscriptionExpiresAt) < now) {
      const err: any = new Error('SUBSCRIPTION_EXPIRED');
      err.code = 'SUBSCRIPTION_EXPIRED';
      throw err;
    }
  } else {
    // Không có ngày hết hạn và không phải vĩnh viễn -> coi như hết hạn
    const err: any = new Error('SUBSCRIPTION_EXPIRED');
    err.code = 'SUBSCRIPTION_EXPIRED';
    throw err;
  }

  return user;
}
