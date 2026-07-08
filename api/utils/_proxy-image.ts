import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Bật CORS cho API này
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const fetchRes = await fetch(url);
    if (!fetchRes.ok) {
      return res.status(fetchRes.status).send('Failed to fetch image');
    }

    const contentType = fetchRes.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    
    // Cache ảnh trong 1 ngày
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');

    const arrayBuffer = await fetchRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (error: any) {
    console.error('Proxy Image Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
