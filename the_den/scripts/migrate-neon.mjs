import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL_UNPOOLED;
if (!databaseUrl) throw new Error("DATABASE_URL_UNPOOLED is required for schema changes.");

const parsedUrl = new URL(databaseUrl);
if (parsedUrl.hostname.includes("-pooler")) {
	throw new Error("Schema changes require a direct, non-pooled Neon connection.");
}

const migrationFile = process.argv.find((argument) => argument.toLowerCase().endsWith(".sql")) || "db/schema.sql";
const migrationPath = resolve(process.cwd(), migrationFile);
if (!migrationPath.startsWith(`${resolve(process.cwd(), "db")}${sep}`)) {
	throw new Error("SQL migrations must be located under db/.");
}

const schema = await readFile(migrationPath, "utf8");
const pool = new Pool({ connectionString: databaseUrl, max: 1 });
const client = await pool.connect();
const checkOnly = process.argv.includes("--check");

try {
	await client.query("BEGIN");
	await client.query(schema);
	await client.query(checkOnly ? "ROLLBACK" : "COMMIT");
	console.log(checkOnly ? "Neon schema check passed; changes rolled back." : "Neon schema applied successfully.");
} catch (error) {
	await client.query("ROLLBACK");
	console.error("Neon schema operation failed.", { code: typeof error?.code === "string" ? error.code : "UNKNOWN" });
	throw error;
} finally {
	client.release();
	await pool.end();
}
