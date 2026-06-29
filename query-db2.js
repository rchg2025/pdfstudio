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
    // Test what Vercel sees by requesting from api/redirect again
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

queryDB();
