import type { VercelRequest, VercelResponse } from '@vercel/node';
import loginHandler from './_login.js';
import registerHandler from './_register.js';
import forgotPasswordHandler from './_forgot-password.js';
import googleHandler from './_google.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;

  try {
    switch (action) {
      case 'login':
        return await loginHandler(req, res);
      case 'register':
        return await registerHandler(req, res);
      case 'forgot-password':
        return await forgotPasswordHandler(req, res);
      case 'google':
        return await googleHandler(req, res);
      default:
        return res.status(404).json({ message: 'API Route Not Found' });
    }
  } catch (error: any) {
    console.error('Auth API Error:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
}
