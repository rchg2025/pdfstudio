const { Client } = require('pg');

const DATABASE_URL = "postgresql://neondb_owner:npg_Yvd4phsckal3@ep-quiet-king-atdwf3ey-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function initDB() {
  console.log("Connecting to Database...");
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log("Connected successfully!");

    // Create the urls table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS urls (
        id SERIAL PRIMARY KEY,
        original_url TEXT NOT NULL,
        alias VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await client.query(createTableQuery);
    console.log("Table 'urls' created successfully (if it didn't exist).");
    
    // Check if table is created and query columns
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log("Tables in DB:", res.rows);
  } catch (error) {
    console.error("Error connecting or executing query:", error);
  } finally {
    await client.end();
  }
}

initDB();
