

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

function loadEnv(envPath) {
  const raw = fs.readFileSync(envPath, 'utf8');
  const result = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    result[key] = value;
  }
  return result;
}

async function main() {
  const passwordToSet = process.env.RESET_PASSWORD || '123456';
  const saltRounds = Number(process.env.SALT_ROUNDS || '10');

  const env = loadEnv(path.join(__dirname, '..', '.env'));

  const pool = new Pool({
    host: env.DB_HOST,
    port: Number(env.DB_PORT || '5432'),
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  });

  const client = await pool.connect();
  try {
    const usersRes = await client.query('SELECT id FROM "user_accounts";');
    const userIds = usersRes.rows.map(r => r.id);
    if (userIds.length === 0) {
      console.log('No users found in "user_accounts". Nothing to reset.');
      return;
    }

    const newHash = await bcrypt.hash(passwordToSet, saltRounds);

    await client.query('BEGIN;');
    for (const userId of userIds) {
      await client.query('UPDATE "user_accounts" SET "passwordHash" = $1 WHERE "id" = $2;', [newHash, userId]);
    }
    await client.query('COMMIT;');

    console.log(`Reset passwordHash for ${userIds.length} user(s).`);
    console.log(`Password to use for login: ${passwordToSet}`);
  } catch (e) {
    await client.query('ROLLBACK;').catch(() => {});
    console.error('Reset failed:', e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => {
  console.error(e);
  process.exitCode = 1;
});

