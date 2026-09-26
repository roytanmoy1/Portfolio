import assert from "node:assert/strict";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL_UNPOOLED is required.");

const sql = neon(databaseUrl);
const rows = await sql`
	SELECT table_name, column_name, data_type
	FROM information_schema.columns
	WHERE table_schema = 'public' AND table_name IN ('chat_uploads', 'chat_messages')
	ORDER BY table_name, ordinal_position
`;
const uploadRows = rows.filter((row) => row.table_name === "chat_uploads");
const messageRows = rows.filter((row) => row.table_name === "chat_messages");
const columns = uploadRows.map((row) => row.column_name);

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
assert.equal(uploadRows.find((row) => row.column_name === "encrypted_content")?.data_type, "bytea");
assert.deepEqual(messageRows.map((row) => row.column_name), [
	"id",
	"session_id",
	"visitor_name",
	"question",
	"response",
	"status",
	"model",
	"attachment_count",
	"created_at",
	"expires_at",
]);

console.log("Encrypted uploads and chat audit schema verified.");