import { NextResponse } from "next/server";
import { getPortfolioSection } from "@/server/portfolio";

export const dynamic = "force-dynamic";

const availableSections = new Set(["experience", "skills", "about", "lab"]);

export async function GET(request) {
	const section = new URL(request.url).searchParams.get("section");
	if (!availableSections.has(section)) {
		return NextResponse.json({ error: "Choose a valid portfolio section." }, { status: 400 });
	}

	try {
		const data = await getPortfolioSection(section);
		return NextResponse.json({ section, data }, { headers: { "Cache-Control": "no-store" } });
	} catch {
		return NextResponse.json(
			{ error: "Portfolio data is temporarily unavailable." },
			{ status: 503, headers: { "Cache-Control": "no-store" } }
		);
	}
}
