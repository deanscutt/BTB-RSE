const { neon } = require("@neondatabase/serverless");
const { BlobNotFoundError, get, put } = require("@vercel/blob");

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.NEON_DATABASE_URL ||
  "";
const appStateBlobPathname = "app-state/default.json";

let sqlClient = null;
let tableReady = false;

function databaseIsConfigured() {
  return Boolean(connectionString);
}

function blobIsConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
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

function appStateStorageReason() {
  return "Hosted storage is not configured. Add DATABASE_URL for Neon or BLOB_READ_WRITE_TOKEN for Vercel Blob.";
}

function isBlobNotFound(error) {
  return (
    error instanceof BlobNotFoundError ||
    error?.name === "BlobNotFoundError" ||
    error?.status === 404 ||
    /not found/i.test(error?.message || "")
  );
}

async function readDatabaseAppState() {
  await ensureAppStateTable();

  const rows = await db()`
    SELECT data, updated_at
    FROM peppermint_app_state
    WHERE id = 'default'
    LIMIT 1
  `;
  const row = rows[0];

  return {
    backend: "neon",
    connected: true,
    found: Boolean(row),
    state: normaliseStateData(row?.data),
    updatedAt: row?.updated_at || null
  };
}

async function readBlobAppState() {
  if (!blobIsConfigured()) {
    return {
      backend: "blob",
      connected: false,
      found: false,
      state: null,
      reason: appStateStorageReason()
    };
  }

  try {
    const blob = await get(appStateBlobPathname, { access: "private" });

    if (!blob) {
      return {
        backend: "blob",
        connected: true,
        found: false,
        state: null,
        updatedAt: null
      };
    }

    const body = await new Response(blob.stream).text();

    return {
      backend: "blob",
      connected: true,
      found: true,
      state: normaliseStateData(body),
      updatedAt: blob.blob.uploadedAt || null
    };
  } catch (error) {
    if (isBlobNotFound(error)) {
      return {
        backend: "blob",
        connected: true,
        found: false,
        state: null,
        updatedAt: null
      };
    }

    throw error;
  }
}

async function readAppState() {
  if (databaseIsConfigured()) {
    try {
      return await readDatabaseAppState();
    } catch (error) {
      if (!blobIsConfigured()) {
        throw error;
      }

      const result = await readBlobAppState();
      return {
        ...result,
        warning: `Neon could not be reached, so Blob storage was used instead. ${error.message || ""}`.trim()
      };
    }
  }

  if (blobIsConfigured()) {
    return readBlobAppState();
  }

  return {
    connected: false,
    found: false,
    state: null,
    reason: appStateStorageReason()
  };
}

async function writeDatabaseAppState(state) {
  await ensureAppStateTable();

  const rows = await db()`
    INSERT INTO peppermint_app_state (id, data, updated_at)
    VALUES ('default', ${JSON.stringify(state)}::jsonb, NOW())
    ON CONFLICT (id)
    DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    RETURNING updated_at
  `;

  return {
    backend: "neon",
    connected: true,
    saved: true,
    updatedAt: rows[0]?.updated_at || null
  };
}

async function writeBlobAppState(state) {
  if (!blobIsConfigured()) {
    return {
      backend: "blob",
      connected: false,
      saved: false,
      reason: appStateStorageReason()
    };
  }

  const savedAt = new Date().toISOString();
  const stateForStorage = state && typeof state === "object" && !Array.isArray(state)
    ? { ...state, savedAt: state.savedAt || savedAt }
    : state;

  await put(appStateBlobPathname, JSON.stringify(stateForStorage), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
    contentType: "application/json; charset=utf-8"
  });

  return {
    backend: "blob",
    connected: true,
    saved: true,
    updatedAt: savedAt
  };
}

async function writeAppState(state) {
  if (databaseIsConfigured()) {
    try {
      return await writeDatabaseAppState(state);
    } catch (error) {
      if (!blobIsConfigured()) {
        throw error;
      }

      const result = await writeBlobAppState(state);
      return {
        ...result,
        warning: `Neon could not be reached, so Blob storage was used instead. ${error.message || ""}`.trim()
      };
    }
  }

  if (blobIsConfigured()) {
    return writeBlobAppState(state);
  }

  return {
    connected: false,
    saved: false,
    reason: appStateStorageReason()
  };
}

module.exports = {
  blobIsConfigured,
  databaseIsConfigured,
  readAppState,
  writeAppState
};
