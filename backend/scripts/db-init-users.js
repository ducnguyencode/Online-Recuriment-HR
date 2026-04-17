/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

function readDotEnv(envPath) {
  const out = {};
  if (!fs.existsSync(envPath)) return out;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    out[key] = value;
  }
  return out;
}

async function main() {
  const envPath = path.join(__dirname, '..', '.env');
  const env = { ...readDotEnv(envPath), ...process.env };

  const dbConfig = {
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT || 5432),
    user: env.DB_USERNAME || 'postgres',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'postgres',
  };

  const superadminEmail = (env.SUPERADMIN_EMAIL || 'superadmin@gmail.com').trim().toLowerCase();
  const superadminPassword = env.SUPERADMIN_PASSWORD || 'SuperAdmin@123';

  const client = new Client(dbConfig);
  await client.connect();

  console.log('[db-init-users] Connected to Postgres');

  // Ensure users table exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" SERIAL PRIMARY KEY,
      "code" varchar NULL,
      "fullName" varchar NOT NULL,
      "email" varchar NOT NULL,
      "passwordHash" varchar NOT NULL,
      "roles" text[] NOT NULL DEFAULT '{}',
      "departmentId" uuid NULL,
      "isActive" boolean NOT NULL DEFAULT true,
      "mustChangePassword" boolean NOT NULL DEFAULT false,
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "updatedAt" timestamptz NOT NULL DEFAULT now()
    );
  `);

  // Unique email constraint (matches entity index name)
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'UQ_user_email'
      ) THEN
        ALTER TABLE "users" ADD CONSTRAINT "UQ_user_email" UNIQUE ("email");
      END IF;
    END $$;
  `);

  // Note: no FK to departments because existing DB uses uuid/int inconsistently across environments.

  // Seed SUPERADMIN if not exists
  const existing = await client.query(`SELECT id, email, roles FROM "users" WHERE email = $1 LIMIT 1`, [
    superadminEmail,
  ]);

  if (existing.rowCount === 0) {
    const passwordHash = await bcrypt.hash(superadminPassword, 10);
    await client.query(
      `
      INSERT INTO "users" ("fullName", "email", "passwordHash", "roles", "departmentId", "isActive", "mustChangePassword")
      VALUES ($1, $2, $3, $4, NULL, true, false)
      `,
      ['Super Admin', superadminEmail, passwordHash, ['SUPERADMIN']],
    );
    console.log(`[db-init-users] Seeded SUPERADMIN: ${superadminEmail}`);
    console.log(`[db-init-users] Default password: ${superadminPassword}`);
    console.log('[db-init-users] Please change this password after first login.');
  } else {
    console.log(`[db-init-users] SUPERADMIN already exists: ${superadminEmail}`);
  }

  await client.end();
  console.log('[db-init-users] Done');
}

main().catch((err) => {
  console.error('[db-init-users] Failed', err);
  process.exit(1);
});

