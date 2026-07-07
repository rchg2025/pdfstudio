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
