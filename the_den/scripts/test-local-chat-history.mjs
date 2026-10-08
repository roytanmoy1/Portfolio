import assert from "node:assert/strict";
import {
	LOCAL_CHAT_STORAGE_KEY,
	LOCAL_CHAT_TTL_MS,
	readLocalChatHistory,
	writeLocalChatHistory,
} from "../features/assistant/domain/localChatHistory.js";

const values = new Map();
const storage = {
	getItem(key) {
		return values.get(key) ?? null;
	},
	setItem(key, value) {
		values.set(key, value);
	},
	removeItem(key) {
		values.delete(key);
	},
};
const startTime = 1_000;

assert.equal(writeLocalChatHistory(storage, {
	visitorName: "  Asha   Example ",
	messages: [
		{ id: "user-1", role: "user", text: "Hello", attachments: [{ name: "private.pdf" }] },
		{ id: "system-1", role: "system", text: "Do not persist this." },
		{ id: "assistant-1", role: "assistant", text: "Welcome, Asha." },
	],
}, startTime), true);

const restored = readLocalChatHistory(storage, startTime + 100);
assert.equal(restored.visitorName, "Asha Example");
assert.deepEqual(restored.messages, [
	{ id: "user-1", role: "user", text: "Hello" },
	{ id: "assistant-1", role: "assistant", text: "Welcome, Asha." },
]);
assert.equal(JSON.parse(storage.getItem(LOCAL_CHAT_STORAGE_KEY)).expiresAt, startTime + LOCAL_CHAT_TTL_MS);

assert.equal(writeLocalChatHistory(storage, {
	visitorName: restored.visitorName,
	messages: restored.messages,
}, startTime + 500), true);
assert.equal(JSON.parse(storage.getItem(LOCAL_CHAT_STORAGE_KEY)).expiresAt, startTime + 500 + LOCAL_CHAT_TTL_MS);

const recentMessages = Array.from({ length: 20 }, (_, index) => ({
	id: `message-${index}`,
	role: index % 2 ? "assistant" : "user",
	text: `Message ${index}`,
}));
writeLocalChatHistory(storage, { visitorName: "Asha", messages: recentMessages }, startTime);
const boundedMessages = readLocalChatHistory(storage, startTime).messages;
assert.equal(boundedMessages.length, 12);
assert.equal(boundedMessages[0].id, "message-8");

const longMessages = Array.from({ length: 12 }, (_, index) => ({
	id: `long-${index}`,
	role: index % 2 ? "assistant" : "user",
	text: "x".repeat(1800),
}));
writeLocalChatHistory(storage, { visitorName: "Asha", messages: longMessages }, startTime);
const boundedCharacters = readLocalChatHistory(storage, startTime).messages.reduce((total, message) => total + message.text.length, 0);
assert.ok(boundedCharacters <= 12_000);

assert.equal(readLocalChatHistory(storage, startTime + LOCAL_CHAT_TTL_MS), null);
assert.equal(storage.getItem(LOCAL_CHAT_STORAGE_KEY), null);

storage.setItem(LOCAL_CHAT_STORAGE_KEY, "not-json");
assert.equal(readLocalChatHistory(storage, startTime), null);
assert.equal(storage.getItem(LOCAL_CHAT_STORAGE_KEY), null);

console.log("Local chat history TTL, bounds, and cleanup verified.");
