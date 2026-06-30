const { neon } = require("@neondatabase/serverless");

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.NEON_DATABASE_URL ||
  "";

let sqlClient = null;
let tableReady = false;

function databaseIsConfigured() {
  return Boolean(connectionString);
}

function db() {
  if (!databaseIsConfigured()) {
    throw new Error("Neon is not configured. Add DATABASE_URL in Vercel environment variables.");
  }

  if (!sqlClient) {
    sqlClient = neon(connectionString);
  }

  return sqlClient;
}

async function ensureAppStateTable() {
  if (tableReady) {
    return;
  }

  const sql = db();

  await sql`
    CREATE TABLE IF NOT EXISTS peppermint_app_state (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  tableReady = true;
}

function normaliseStateData(data) {
  if (!data) {
    return null;
  }

  return typeof data === "string" ? JSON.parse(data) : data;
}

async function readAppState() {
  if (!databaseIsConfigured()) {
    return {
      connected: false,
      found: false,
      state: null,
      reason: "Neon is not configured. Add DATABASE_URL in Vercel environment variables."
    };
  }

  await ensureAppStateTable();

  const rows = await db()`
    SELECT data, updated_at
    FROM peppermint_app_state
    WHERE id = 'default'
    LIMIT 1
  `;
  const row = rows[0];

  return {
    connected: true,
    found: Boolean(row),
    state: normaliseStateData(row?.data),
    updatedAt: row?.updated_at || null
  };
}

async function writeAppState(state) {
  if (!databaseIsConfigured()) {
    return {
      connected: false,
      saved: false,
      reason: "Neon is not configured. Add DATABASE_URL in Vercel environment variables."
    };
  }

  await ensureAppStateTable();

  const rows = await db()`
    INSERT INTO peppermint_app_state (id, data, updated_at)
    VALUES ('default', ${JSON.stringify(state)}::jsonb, NOW())
    ON CONFLICT (id)
    DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    RETURNING updated_at
  `;

  return {
    connected: true,
    saved: true,
    updatedAt: rows[0]?.updated_at || null
  };
}

module.exports = {
  databaseIsConfigured,
  readAppState,
  writeAppState
};
