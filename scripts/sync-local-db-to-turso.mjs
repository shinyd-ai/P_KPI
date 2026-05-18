import { loadEnvConfig } from "@next/env";
import { createClient } from "@libsql/client";

loadEnvConfig(process.cwd());

const LOCAL_DATABASE_URL = process.env.LOCAL_DATABASE_URL ?? "file:./prisma/dev.db";
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;
const overwrite = process.env.OVERWRITE_TURSO === "1";

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN.");
  process.exit(1);
}

if (!overwrite) {
  console.error("Refusing to overwrite Turso without OVERWRITE_TURSO=1.");
  process.exit(1);
}

const local = createClient({ url: LOCAL_DATABASE_URL });
const remote = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

const tables = [
  {
    name: "Category",
    columns: ["id", "name", "icon", "color", "order", "createdAt"],
  },
  {
    name: "Goal",
    columns: [
      "id",
      "year",
      "title",
      "description",
      "status",
      "categoryId",
      "createdAt",
      "updatedAt",
    ],
  },
  {
    name: "MonthlyPlan",
    columns: [
      "id",
      "year",
      "month",
      "title",
      "description",
      "goalId",
      "status",
      "createdAt",
      "resultMemo",
      "reviewedAt",
    ],
  },
  {
    name: "DailyLog",
    columns: [
      "id",
      "date",
      "title",
      "description",
      "durationMinutes",
      "alignmentType",
      "monthlyPlanId",
      "goalId",
      "createdAt",
    ],
  },
  {
    name: "DailyPlan",
    columns: [
      "id",
      "date",
      "title",
      "monthlyPlanId",
      "goalId",
      "completed",
      "completedAt",
      "note",
      "rolledOver",
      "estimatedMinutes",
      "actualMinutes",
      "createdAt",
    ],
  },
  {
    name: "MonthlyReview",
    columns: ["id", "year", "month", "content", "stats", "createdAt"],
  },
];

const deleteOrder = [...tables].reverse();

function quoteIdentifier(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function insertStatement(table, row) {
  const columnsSql = table.columns.map(quoteIdentifier).join(", ");
  const placeholders = table.columns.map(() => "?").join(", ");

  return {
    sql: `INSERT INTO ${quoteIdentifier(table.name)} (${columnsSql}) VALUES (${placeholders})`,
    args: table.columns.map((column) => row[column]),
  };
}

async function countRows(client, tableName) {
  const result = await client.execute(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(tableName)}`);
  return Number(result.rows[0].count);
}

async function main() {
  console.log(`Reading local database: ${LOCAL_DATABASE_URL}`);
  console.log(`Writing Turso database: ${TURSO_DATABASE_URL}`);

  for (const table of deleteOrder) {
    await remote.execute(`DELETE FROM ${quoteIdentifier(table.name)}`);
  }

  for (const table of tables) {
    const result = await local.execute(`SELECT * FROM ${quoteIdentifier(table.name)}`);
    const statements = result.rows.map((row) => insertStatement(table, row));

    if (statements.length > 0) {
      await remote.batch(statements, "write");
    }

    const remoteCount = await countRows(remote, table.name);
    console.log(`${table.name}: copied ${statements.length}, remote now ${remoteCount}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
