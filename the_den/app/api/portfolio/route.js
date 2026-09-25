import { NextResponse } from "next/server";
import { getDatabase } from "../../lib/neon";

export const dynamic = "force-dynamic";

export async function GET() {
	const database = getDatabase();
	if (!database) {
		return NextResponse.json({ source: "static", configured: false });
	}

	try {
		const rows = await database`
			SELECT content, updated_at
			FROM portfolio_content
			WHERE content_key = 'portfolio'
			LIMIT 1
		`;

		if (!rows.length) {
			return NextResponse.json({ error: "Portfolio content has not been seeded." }, { status: 404 });
		}

		return NextResponse.json({
			source: "neon",
			configured: true,
			updatedAt: rows[0].updated_at,
			content: rows[0].content,
		});
	} catch {
		return NextResponse.json({ error: "Neon is unavailable." }, { status: 503 });
	}
}
