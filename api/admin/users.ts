import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
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

    if (req.method === 'POST') {
      const { email, password, name, role } = req.body;
      if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
      
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(400).json({ message: 'Email đã tồn tại' });
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, password: hashedPassword, name, role: role || 'USER' },
        select: { id: true, email: true, name: true, role: true, createdAt: true }
      });
      return res.status(201).json(user);
    }

    if (req.method === 'PUT') {
      const { id, email, password, name, role } = req.body;
      if (!id) return res.status(400).json({ message: 'Invalid ID' });
      
      const dataToUpdate: any = { email, name, role };
      if (password) {
        dataToUpdate.password = await bcrypt.hash(password, 10);
      }
      
      const user = await prisma.user.update({
        where: { id },
        data: dataToUpdate,
        select: { id: true, email: true, name: true, role: true, createdAt: true }
      });
      return res.status(200).json(user);
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
