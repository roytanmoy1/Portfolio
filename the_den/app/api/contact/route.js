import { NextResponse } from "next/server";
import { sendContactEmail } from "../../lib/contactMailer";
import { getDatabase } from "../../lib/neon";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 32 * 1024;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 4000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const controlCharacterPattern = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const requestLog = new Map();

const response = (body, status) =>
	NextResponse.json(body, {
		status,
		headers: { "Cache-Control": "no-store" },
	});

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

export async function POST(request) {
	const address = (request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown")
		.split(",")[0]
		.trim();
	const now = Date.now();
	const previous = requestLog.get(address);

	if (!previous || now >= previous.resetAt) {
		requestLog.set(address, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
	} else if (previous.count >= RATE_LIMIT_MAX_REQUESTS) {
		return response({ error: "Too many messages. Please try again later." }, 429);
	} else {
		requestLog.set(address, { ...previous, count: previous.count + 1 });
	}

	const contentLength = Number(request.headers.get("content-length") || 0);
	if (contentLength > MAX_BODY_BYTES) {
		return response({ error: "Request is too large." }, 413);
	}

	const origin = request.headers.get("origin");
	if (origin) {
		try {
			if (new URL(origin).origin !== new URL(request.url).origin) {
				return response({ error: "Cross-origin requests are not allowed." }, 403);
			}
		} catch {
			return response({ error: "Invalid request origin." }, 403);
		}
	}

	const contentType = request.headers.get("content-type") || "";
	if (!contentType.includes("application/json")) {
		return response({ error: "JSON is required." }, 415);
	}

	let payload;
	try {
		payload = await request.json();
	} catch {
		return response({ error: "Invalid JSON payload." }, 400);
	}

	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		return response({ error: "Invalid form payload." }, 400);
	}

	const name = cleanText(payload.name).replace(/\s+/g, " ");
	const email = cleanText(payload.email).toLowerCase();
	const message = cleanText(payload.message);
	const honeypot = cleanText(payload.company);

	if (honeypot) {
		return response({ ok: true }, 200);
	}

	if (
		name.length < 2 ||
		name.length > MAX_NAME_LENGTH ||
		email.length > MAX_EMAIL_LENGTH ||
		!emailPattern.test(email) ||
		message.length < 10 ||
		message.length > MAX_MESSAGE_LENGTH ||
		controlCharacterPattern.test(name) ||
		controlCharacterPattern.test(email) ||
		controlCharacterPattern.test(message)
	) {
		return response({ error: "Please provide a valid name, email, and message." }, 422);
	}

	const database = getDatabase();
	if (database) {
		try {
			await database`
				INSERT INTO contact_messages (name, email, message)
				VALUES (${name}, ${email}, ${message})
			`;
		} catch {
			return response({ error: "Message storage is temporarily unavailable." }, 503);
		}
	}

	try {
		const delivery = await sendContactEmail({ name, email, message });
		if (!delivery.configured) return response({ error: "Email delivery is not configured." }, 503);
		if (!delivery.accepted) return response({ error: "Email delivery failed." }, 502);
		return response({ ok: true }, 200);
	} catch (error) {
		console.error("Contact email delivery failed.", {
			code: typeof error?.code === "string" ? error.code : "UNKNOWN",
			command: typeof error?.command === "string" ? error.command : "UNKNOWN",
			responseCode: Number.isInteger(error?.responseCode) ? error.responseCode : null,
		});
		return response({ error: "Email delivery is temporarily unavailable." }, 502);
	}
}
