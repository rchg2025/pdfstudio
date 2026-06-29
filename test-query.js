import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = "postgresql://neondb_owner:npg_Yvd4phsckal3@ep-quiet-king-atdwf3ey-pooler.c-9.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";

async function testQuery(alias) {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const queryResult = await client.query('SELECT original_url FROM urls WHERE alias = $1', [alias]);
    console.log(`Result for ${alias}:`, queryResult.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

testQuery('tieng_nhat');
