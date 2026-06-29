import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = "postgresql://neondb_owner:npg_Yvd4phsckal3@ep-quiet-king-atdwf3ey-pooler.c-9.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";

async function queryDB() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const result = await client.query("SELECT * FROM urls WHERE alias = 'qawa6f'");
    console.log("qawa6f exists:", result.rows.length > 0);
    const result2 = await client.query("SELECT * FROM urls ORDER BY created_at DESC LIMIT 5");
    console.log("Latest:", result2.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

queryDB();
