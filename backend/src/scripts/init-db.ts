import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { CONFIG } from '../config';

async function initDatabase() {
  console.log('\n=======================================================');
  console.log('🐘 MosqueNearMe — PostgreSQL Database Initializer');
  console.log('=======================================================\n');

  if (!CONFIG.databaseUrl) {
    console.error('❌ Error: DATABASE_URL is not set.');
    console.error('Please configure DATABASE_URL in backend/.env before running this command.');
    console.error('Example: DATABASE_URL=postgresql://user:pass@localhost:5432/mosquenearme\n');
    process.exit(1);
  }

  const safeUrl = CONFIG.databaseUrl.replace(/:([^:@]+)@/, ':***@');
  console.log(`Connecting to: ${safeUrl}...`);

  const pool = new Pool({
    connectionString: CONFIG.databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const client = await pool.connect();
    console.log('✓ Successfully connected to PostgreSQL server.');

    let schemaPath = path.resolve(__dirname, '..', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      schemaPath = path.resolve(__dirname, '..', '..', 'src', 'schema.sql');
    }
    if (!fs.existsSync(schemaPath)) {
      schemaPath = path.resolve(process.cwd(), 'src', 'schema.sql');
    }
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    console.log('Applying src/schema.sql...');

    await client.query(schemaSql);
    client.release();

    console.log('✓ Schema applied successfully:');
    console.log('   - Table: donations');
    console.log('   - Table: payouts');
    console.log('   - Table: webhook_events');
    console.log('   - Indexes created for fast lookups & ledger calculations.');
    console.log('\nDatabase is ready for production.\n');
  } catch (err: any) {
    console.error('❌ Database initialization failed:');
    console.error(err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();
