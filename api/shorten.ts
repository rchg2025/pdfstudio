import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { originalUrl, customAlias } = req.body;

  if (!originalUrl || !customAlias) {
    return res.status(400).json({ error: 'Thiếu tham số originalUrl hoặc customAlias' });
  }
  
  // Basic URL validation
  try {
    new URL(originalUrl);
  } catch (e) {
    return res.status(400).json({ error: 'URL không hợp lệ' });
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Check if alias exists
    const checkQuery = await client.query('SELECT id FROM urls WHERE alias = $1', [customAlias]);
    if (checkQuery.rows.length > 0) {
      return res.status(409).json({ error: 'Đuôi tùy chỉnh này đã tồn tại, vui lòng chọn tên khác.' });
    }

    // Insert new URL
    await client.query('INSERT INTO urls (original_url, alias) VALUES ($1, $2)', [originalUrl, customAlias]);
    
    return res.status(200).json({ success: true, alias: customAlias });
  } catch (error: any) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Lỗi hệ thống khi lưu URL' });
  } finally {
    await client.end();
  }
}
