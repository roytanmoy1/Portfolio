import { neon } from "@neondatabase/serverless";

let database;

export function getDatabase() {
	if (!process.env.DATABASE_URL) return null;
	if (!database) database = neon(process.env.DATABASE_URL);
	return database;
}
