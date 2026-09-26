import assert from "node:assert/strict";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL_UNPOOLED is required.");

const sql = neon(databaseUrl);
const rows = await sql`
	SELECT column_name, data_type
	FROM information_schema.columns
	WHERE table_schema = 'public' AND table_name = 'chat_uploads'
	ORDER BY ordinal_position
`;
const columns = rows.map((row) => row.column_name);

assert.deepEqual(columns, [
	"id",
	"session_id",
	"original_name",
	"mime_type",
	"size_bytes",
	"sha256",
	"encrypted_content",
	"encryption_iv",
	"encryption_tag",
	"created_at",
	"expires_at",
]);
assert.equal(rows.find((row) => row.column_name === "encrypted_content")?.data_type, "bytea");

console.log("Encrypted chat upload schema verified.");