import assert from "node:assert/strict";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL_UNPOOLED is required.");

const sql = neon(databaseUrl);
const [summary] = await sql`
	SELECT
		COUNT(*)::int AS count,
		COALESCE(BOOL_AND(OCTET_LENGTH(encrypted_content) > 0), false) AS has_ciphertext,
		COALESCE(BOOL_AND(POSITION(CONVERT_TO('Candidate note:', 'UTF8') IN encrypted_content) = 0), false) AS plaintext_absent
	FROM chat_uploads
`;

assert.ok(summary.count > 0, "Expected at least one live upload row.");
assert.equal(summary.has_ciphertext, true);
assert.equal(summary.plaintext_absent, true);

console.log(`Verified ${summary.count} encrypted chat upload row(s); plaintext marker absent.`);