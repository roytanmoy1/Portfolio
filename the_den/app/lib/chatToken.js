import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";

export const CHAT_TOKEN_ISSUER = "tanmoy-portfolio";
export const CHAT_TOKEN_AUDIENCE = "portfolio-chat";

export function getChatTokenKey(secret) {
	if (typeof secret !== "string" || secret.length < 32) {
		throw new Error("CHAT_TOKEN_SECRET must contain at least 32 characters.");
	}
	return new TextEncoder().encode(secret);
}

export function normalizeWebSocketUrl(value) {
	const url = new URL(value);
	if (url.protocol === "https:") url.protocol = "wss:";
	if (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)) url.protocol = "ws:";
	if (!['wss:', 'ws:'].includes(url.protocol) || (url.protocol === "ws:" && !["localhost", "127.0.0.1"].includes(url.hostname))) {
		throw new Error("CHAT_WEBSOCKET_URL must use secure WebSockets.");
	}
	return url.href;
}

export async function issueChatToken({ origin, secret, sessionId = randomUUID() }) {
	return new SignJWT({ origin, scope: "portfolio:chat" })
		.setProtectedHeader({ alg: "HS256", typ: "JWT" })
		.setSubject(sessionId)
		.setJti(randomUUID())
		.setIssuer(CHAT_TOKEN_ISSUER)
		.setAudience(CHAT_TOKEN_AUDIENCE)
		.setIssuedAt()
		.setExpirationTime("2m")
		.sign(getChatTokenKey(secret));
}