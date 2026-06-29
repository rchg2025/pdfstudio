import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const alias = req.query.alias as string;

  if (!alias) {
    return res.redirect(302, '/');
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const queryResult = await client.query('SELECT original_url FROM urls WHERE alias = $1', [alias]);

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
