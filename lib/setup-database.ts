import { readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

const LEGACY_TABLES = ["media", "events"] as const;

function getConnectionString() {
  const connectionString = process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    throw new Error("SUPABASE_DB_URL is not configured");
  }

  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) return connectionString;

  const url = new URL(connectionString);
  url.password = password;
  return url.toString();
}

async function getColumns(client: Client, tableName: string) {
  const { rows } = await client.query<{ column_name: string; data_type: string }>(
    `
      select column_name, data_type
      from information_schema.columns
      where table_schema = 'public'
        and table_name = $1
    `,
    [tableName]
  );

  return new Map(rows.map((row) => [row.column_name, row.data_type]));
}

async function getRowCount(client: Client, tableName: string) {
  const { rows } = await client.query<{ count: number }>(
    `select count(*)::int as count from public.${tableName}`
  );
  return rows[0]?.count ?? 0;
}

async function prepareLegacySchema(client: Client) {
  const eventColumns = await getColumns(client, "events");
  const mediaColumns = await getColumns(client, "media");
  const hasLegacyEvents = eventColumns.size > 0 && !eventColumns.has("manager_id");
  const hasLegacyMedia =
    mediaColumns.size > 0 && mediaColumns.get("guest_id") !== "uuid";

  if (!hasLegacyEvents && !hasLegacyMedia) return;

  for (const table of LEGACY_TABLES) {
    const columns = table === "events" ? eventColumns : mediaColumns;
    if (columns.size > 0 && (await getRowCount(client, table)) > 0) {
      throw new Error("LEGACY_SCHEMA_HAS_DATA");
    }
  }

  await client.query("drop table if exists public.media cascade");
  await client.query("drop table if exists public.events cascade");
}

export async function runDatabaseSetup() {
  const connectionString = getConnectionString();

  const schemaPath = path.join(process.cwd(), "supabase", "schema.sql");
  const schemaSql = await readFile(schemaPath, "utf8");
  const client = new Client({
    connectionString,
    ssl: connectionString.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    await prepareLegacySchema(client);
    await client.query(schemaSql);
  } finally {
    await client.end();
  }
}
