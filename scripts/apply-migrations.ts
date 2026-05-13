/**
 * Apply pending Supabase migrations using the service-role connection.
 *
 * Usage: SUPABASE_DB_URL=postgres://... npm run db:migrate
 *
 * Why a custom runner: supabase-cli requires the docker stack; for a small
 * project hosted on managed Supabase, we just need to splat each .sql file
 * into the database through a direct pg connection. Idempotent — each
 * migration file uses CREATE TABLE IF NOT EXISTS / DROP POLICY IF EXISTS.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.resolve(__dirname, '../supabase/migrations');

async function main() {
  const url = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
  if (!url) {
    console.error('SUPABASE_DB_URL or DATABASE_URL must be set');
    process.exit(1);
  }
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    // Track applied files so reruns are cheap.
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS cointier;
      CREATE TABLE IF NOT EXISTS cointier._migrations (
        filename text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      );
    `);
    const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
    for (const filename of files) {
      const { rowCount } = await client.query('SELECT 1 FROM cointier._migrations WHERE filename = $1', [filename]);
      if (rowCount && rowCount > 0) {
        console.log(`✓ ${filename} (already applied)`);
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8');
      console.log(`→ Applying ${filename} (${sql.length} chars)`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO cointier._migrations (filename) VALUES ($1)', [filename]);
        await client.query('COMMIT');
        console.log(`✓ ${filename} applied`);
      } catch (e) {
        await client.query('ROLLBACK');
        console.error(`✗ ${filename} failed:`, e instanceof Error ? e.message : e);
        process.exit(2);
      }
    }
    console.log('All migrations applied.');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(3);
});
