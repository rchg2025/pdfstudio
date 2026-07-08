import type { VercelRequest, VercelResponse } from '@vercel/node';
import statsHandler from './_stats.js';
import shortenHandler from './_shorten.js';
import proxyImageHandler from './_proxy-image.js';
import googleConfigHandler from './_google.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;

  try {
    switch (action) {
      case 'stats':
        return await statsHandler(req, res);
      case 'shorten':
        return await shortenHandler(req, res);
      case 'proxy-image':
        return await proxyImageHandler(req, res);
      case 'google':
        return await googleConfigHandler(req, res);
      default:
        return res.status(404).json({ message: 'API Route Not Found' });
    }
  } catch (error: any) {
    console.error('Utils API Error:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
}
