import assert from "node:assert/strict";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL_UNPOOLED is required.");

const visitorName = process.argv[2] || "Audit Tester";
const sql = neon(databaseUrl);
const rows = await sql`
	SELECT visitor_name, question, response, status, model, attachment_count, created_at
	FROM chat_messages
	WHERE visitor_name = ${visitorName} AND expires_at > NOW()
	ORDER BY created_at DESC
	LIMIT 10
`;

const byQuestion = new Map(rows.map((row) => [row.question.toLowerCase(), row]));
for (const question of [
	"hi",
	"what are his top 4 skillsets",
	"what are tanmoys top 4 skillsets",
	"which projects show ai experience?",
	"what is tanmoy's current role?",
]) {
	const row = byQuestion.get(question);
	assert.ok(row, `Missing audit row for: ${question}`);
	assert.equal(row.status, "answered");
	assert.equal(row.model, "deterministic");
	assert.ok(row.response.length > 20);
}

console.log(`Verified ${rows.length} retained chat audit row(s) for ${visitorName}.`);