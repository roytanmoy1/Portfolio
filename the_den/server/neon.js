import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";

let database;
let portfolioPool;

const createPostgresQueryTag = (pool) => async (strings, ...values) => {
	const query = strings.reduce((text, fragment, index) => (
		text + fragment + (index < values.length ? `$${index + 1}` : "")
	), "");
	const result = await pool.query(query, values);
	return result.rows;
};

export function getDatabase() {
	const localDatabaseUrl = process.env.PORTFOLIO_DATABASE_URL;
	if (localDatabaseUrl) {
		if (!portfolioPool) {
			const url = new URL(localDatabaseUrl);
			url.searchParams.set("sslmode", "verify-full");
			portfolioPool = new Pool({ connectionString: url.href, max: 2 });
			database = createPostgresQueryTag(portfolioPool);
		}
		return database;
	}

	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) return null;
	if (!database) database = neon(databaseUrl);
	return database;
}
