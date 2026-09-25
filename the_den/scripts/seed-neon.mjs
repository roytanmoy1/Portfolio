import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error("DATABASE_URL is required to seed Neon.");
}

const dataPath = resolve(process.cwd(), "app/data/portfolioData.js");
const source = await readFile(dataPath, "utf8");
const portfolioData = new Function(source.replace(/^export const portfolioData = /, "return "))();
const sql = neon(databaseUrl);
const content = JSON.stringify(portfolioData);

await sql`
	CREATE EXTENSION IF NOT EXISTS pgcrypto
`;

await sql`
	CREATE TABLE IF NOT EXISTS portfolio_content (
		content_key TEXT PRIMARY KEY,
		content JSONB NOT NULL,
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	)
`;

await sql`
	CREATE TABLE IF NOT EXISTS contact_messages (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		name VARCHAR(80) NOT NULL,
		email VARCHAR(254) NOT NULL,
		message VARCHAR(4000) NOT NULL,
		status TEXT NOT NULL DEFAULT 'received',
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	)
`;

await sql`
	CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
		ON contact_messages (created_at DESC)
`;

await sql`
	INSERT INTO portfolio_content (content_key, content, updated_at)
	VALUES ('portfolio', ${content}::jsonb, NOW())
	ON CONFLICT (content_key)
	DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()
`;

console.log("Neon portfolio content seeded successfully.");
