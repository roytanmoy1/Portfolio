import { NextResponse } from "next/server";
import { issueChatToken, normalizeWebSocketUrl } from "../../../lib/chatToken";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 12;
const requestLog = new Map();

const response = (body, status) =>
	NextResponse.json(body, {
		status,
		headers: { "Cache-Control": "no-store" },
	});

export async function POST(request) {
	const origin = request.headers.get("origin");
	const requestOrigin = new URL(request.url).origin;
	const fetchSite = request.headers.get("sec-fetch-site");

	if (!origin || origin !== requestOrigin || (fetchSite && fetchSite !== "same-origin")) {
		return response({ error: "Cross-origin requests are not allowed." }, 403);
	}

	const address = (request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown")
		.split(",")[0]
		.trim();
	const now = Date.now();
	const previous = requestLog.get(address);

	if (!previous || now >= previous.resetAt) {
		requestLog.set(address, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
	} else if (previous.count >= RATE_LIMIT_MAX_REQUESTS) {
		return response({ error: "Too many connection attempts. Please try again shortly." }, 429);
	} else {
		requestLog.set(address, { ...previous, count: previous.count + 1 });
	}

	try {
		const websocketUrl = normalizeWebSocketUrl(process.env.CHAT_WEBSOCKET_URL);
		const token = await issueChatToken({ origin, secret: process.env.CHAT_TOKEN_SECRET });
		return response({ token, websocketUrl }, 200);
	} catch {
		return response({ error: "Portfolio assistant is not configured." }, 503);
	}
}