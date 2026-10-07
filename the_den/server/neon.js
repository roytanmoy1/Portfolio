import { neon } from "@neondatabase/serverless";

let database;

export function getDatabase() {
	const databaseUrl = process.env.PORTFOLIO_DATABASE_URL || process.env.DATABASE_URL;
	if (!databaseUrl) return null;
	if (!database) database = neon(databaseUrl);
	return database;
}
