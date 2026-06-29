import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let alias = (req.query.alias as string || '').trim();
  
  console.log("INCOMING ALIAS FROM REQ.QUERY.ALIAS:", alias, "REQ.URL:", req.url);

  if (!alias) {
    return res.redirect(302, '/');
  }

  // Loại bỏ dấu gạch chéo cuối nếu có
  alias = alias.replace(/\/$/, '');

  const dbUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_Yvd4phsckal3@ep-quiet-king-atdwf3ey-pooler.c-9.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Sử dụng ILIKE để không phân biệt chữ hoa chữ thường
    const queryResult = await client.query('SELECT original_url FROM urls WHERE alias ILIKE $1', [alias]);

    if (queryResult.rows.length > 0) {
      const { original_url } = queryResult.rows[0];
      // Perform a 301 Permanent Redirect to the original URL
      return res.redirect(301, original_url);
    } else {
      // Alias not found, redirect to home with a not-found param
      return res.redirect(302, '/?error=notfound');
    }
  } catch (error) {
    console.error('Database error during redirect:', error);
    return res.redirect(302, '/');
  } finally {
    await client.end();
  }
}
