export const LOCAL_CHAT_STORAGE_KEY = "portfolio-chat:v1";
export const LOCAL_CHAT_TTL_MS = 24 * 60 * 60 * 1000;

const MAX_MESSAGES = 12;
const MAX_HISTORY_CHARACTERS = 12_000;
const MAX_MESSAGE_LENGTH = 1800;
const allowedRoles = new Set(["user", "assistant", "error"]);
const controlCharacterPattern = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\uFEFF]/g;

const normalizeVisitorName = (value) =>
	typeof value === "string"
		? value.replace(controlCharacterPattern, "").replace(/\s+/g, " ").trim().slice(0, 60)
		: "";

const sanitizeMessages = (messages, now) => {
	if (!Array.isArray(messages)) return [];

	const validMessages = messages
		.filter((message) => allowedRoles.has(message?.role) && typeof message.text === "string")
		.map((message, index) => ({
			id: typeof message.id === "string" && message.id ? message.id.slice(0, 100) : `restored-${now}-${index}`,
			role: message.role,
			text: message.text.replace(controlCharacterPattern, "").slice(0, MAX_MESSAGE_LENGTH),
		}))
		.filter((message) => message.text.trim())
		.slice(-MAX_MESSAGES);

	const retainedMessages = [];
	let retainedCharacters = 0;
	for (let index = validMessages.length - 1; index >= 0; index -= 1) {
		const message = validMessages[index];
		if (retainedCharacters + message.text.length > MAX_HISTORY_CHARACTERS) break;
		retainedMessages.unshift(message);
		retainedCharacters += message.text.length;
	}
	return retainedMessages;
};

export function readLocalChatHistory(storage = globalThis.localStorage, now = Date.now()) {
	if (!storage) return null;

	try {
		const serialized = storage.getItem(LOCAL_CHAT_STORAGE_KEY);
		if (!serialized) return null;

		const record = JSON.parse(serialized);
		const visitorName = normalizeVisitorName(record?.visitorName);
		if (record?.version !== 1 || !Number.isFinite(record.expiresAt) || record.expiresAt <= now || visitorName.length < 2) {
			storage.removeItem(LOCAL_CHAT_STORAGE_KEY);
			return null;
		}

		return {
			visitorName,
			messages: sanitizeMessages(record.messages, now),
		};
	} catch {
		try {
			storage.removeItem(LOCAL_CHAT_STORAGE_KEY);
		} catch {}
		return null;
	}
}

export function writeLocalChatHistory(storage = globalThis.localStorage, { visitorName, messages }, now = Date.now()) {
	if (!storage) return false;
	const normalizedName = normalizeVisitorName(visitorName);
	if (normalizedName.length < 2) return false;

	const record = {
		version: 1,
		expiresAt: now + LOCAL_CHAT_TTL_MS,
		visitorName: normalizedName,
		messages: sanitizeMessages(messages, now),
	};

	try {
		storage.setItem(LOCAL_CHAT_STORAGE_KEY, JSON.stringify(record));
		return true;
	} catch {
		return false;
	}
}
