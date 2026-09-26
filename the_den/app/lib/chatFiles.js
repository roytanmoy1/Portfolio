import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export const MAX_CHAT_FILES = 5;
export const MAX_CHAT_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_CHAT_UPLOAD_BYTES = MAX_CHAT_FILES * MAX_CHAT_FILE_BYTES;

const allowedTypes = new Set([
	"application/json",
	"application/pdf",
	"image/jpeg",
	"image/png",
	"image/webp",
	"text/csv",
	"text/markdown",
	"text/plain",
]);
const extensionTypes = new Map([
	["csv", "text/csv"],
	["jpeg", "image/jpeg"],
	["jpg", "image/jpeg"],
	["json", "application/json"],
	["md", "text/markdown"],
	["pdf", "application/pdf"],
	["png", "image/png"],
	["txt", "text/plain"],
	["webp", "image/webp"],
]);

export class ChatFileValidationError extends Error {}

export function sanitizeChatFileName(value) {
	const basename = String(value || "file").split(/[\\/]/).pop();
	return basename.replace(/[^A-Za-z0-9._() -]/g, "_").replace(/\s+/g, " ").slice(0, 120) || "file";
}

export function resolveChatFileType(name, declaredType) {
	const normalized = String(declaredType || "").toLowerCase().trim();
	const extension = String(name || "").split(".").pop()?.toLowerCase();
	const inferred = extensionTypes.get(extension);
	const type = normalized && normalized !== "application/octet-stream" ? normalized : inferred;
	if (!type || !allowedTypes.has(type)) throw new ChatFileValidationError("Unsupported file type.");
	if (inferred && inferred !== type) throw new ChatFileValidationError("File type does not match its extension.");
	return type;
}

export function validateChatFileMetadata({ name, size, type }) {
	if (!Number.isInteger(size) || size < 1 || size > MAX_CHAT_FILE_BYTES) {
		throw new ChatFileValidationError("Each file must be no larger than 2 MiB.");
	}
	return {
		name: sanitizeChatFileName(name),
		size,
		type: resolveChatFileType(name, type),
	};
}

export function validateChatFileContent(type, bytes) {
	const buffer = Buffer.from(bytes);
	const startsWith = (signature) => signature.every((byte, index) => buffer[index] === byte);
	let valid = true;

	if (type === "application/pdf") valid = buffer.subarray(0, 5).toString("ascii") === "%PDF-";
	if (type === "image/png") valid = startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	if (type === "image/jpeg") valid = startsWith([0xff, 0xd8, 0xff]);
	if (type === "image/webp") {
		valid = buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
	}
	if (type.startsWith("text/") || type === "application/json") {
		try {
			const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
			valid = !text.includes("\u0000");
			if (valid && type === "application/json") JSON.parse(text);
		} catch {
			valid = false;
		}
	}

	if (!valid) throw new ChatFileValidationError("File contents do not match the declared type.");
	return buffer;
}

export function getFileEncryptionKey(value) {
	if (typeof value !== "string" || !/^[A-Za-z0-9+/]{43}=$/.test(value)) {
		throw new Error("FILE_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
	}
	const key = Buffer.from(value, "base64");
	if (key.length !== 32) throw new Error("FILE_ENCRYPTION_KEY must decode to 32 bytes.");
	return key;
}

export function encryptChatFile(bytes, key) {
	const plaintext = Buffer.from(bytes);
	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", key, iv);
	const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
	return {
		authTag: cipher.getAuthTag(),
		ciphertext,
		iv,
		sha256: createHash("sha256").update(plaintext).digest("hex"),
	};
}

export function decryptChatFile({ authTag, ciphertext, iv }, key) {
	const decipher = createDecipheriv("aes-256-gcm", key, iv);
	decipher.setAuthTag(authTag);
	return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}