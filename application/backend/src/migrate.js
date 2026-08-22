/**
 * migrate.js — Neon Postgres migration + seed runner
 *
 * Runs schema.sql first (idempotent: uses CREATE TABLE IF NOT EXISTS),
 * then runs each seed file in order from queries/incident_seed/.
 *
 * Usage:
 *   cd application/backend
 *   npm run migrate
 *
 * Requires DATABASE_URL to be set in .env or your environment.
 */

import dotenv from 'dotenv';
import pkg from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Client } = pkg;

// ── Resolve paths relative to this file ──────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
// backend/src → application/queries
const QUERIES_DIR = resolve(__dirname, '../../queries');
const SCHEMA_FILE = join(QUERIES_DIR, 'schema.sql');
const SEED_DIR    = join(QUERIES_DIR, 'incident_seed');

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set. Check your .env file.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Neon Postgres\n');

    // ── 1. Run schema ───────────────────────────────────────
    console.log('📐 Running schema.sql...');
    const schema = readFileSync(SCHEMA_FILE, 'utf8');
    await client.query(schema);
    console.log('   ✓ Schema applied\n');

    // ── 2. Run seed files in order ──────────────────────────
    const seedFiles = readdirSync(SEED_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort(); // ensures 001-, 002-, ... order

    if (seedFiles.length === 0) {
      console.log('ℹ️  No seed files found in incident_seed/ — skipping seed step.');
    } else {
      console.log(`🌱 Running ${seedFiles.length} seed file(s)...`);
      for (const file of seedFiles) {
        const filePath = join(SEED_DIR, file);
        const sql = readFileSync(filePath, 'utf8');
        process.stdout.write(`   • ${file} ... `);
        await client.query(sql);
        console.log('✓');
      }
      console.log('\n✅ All seed files applied.');
    }

    console.log('\n🎉 Migration complete. Your Neon database is ready.');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
