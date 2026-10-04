import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import readXlsxFile from "read-excel-file/node";

export const MAX_CHAT_FILES = 5;
export const MAX_CHAT_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_CHAT_UPLOAD_BYTES = MAX_CHAT_FILES * MAX_CHAT_FILE_BYTES;

const allowedTypes = new Set([
	"application/pdf",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	"text/plain",
]);
const extensionTypes = new Map([
	["pdf", "application/pdf"],
	["txt", "text/plain"],
	["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
]);

const validateZipExpansion = (buffer) => {
	let entries = 0;
	let totalUncompressedBytes = 0;

	for (let offset = 0; offset <= buffer.length - 46;) {
		if (buffer.readUInt32LE(offset) !== 0x02014b50) {
			offset += 1;
			continue;
		}

		const uncompressedBytes = buffer.readUInt32LE(offset + 24);
		const nameLength = buffer.readUInt16LE(offset + 28);
		const extraLength = buffer.readUInt16LE(offset + 30);
		const commentLength = buffer.readUInt16LE(offset + 32);
		if (uncompressedBytes === 0xffffffff) throw new ChatFileValidationError("ZIP64 workbooks are not supported.");
		totalUncompressedBytes += uncompressedBytes;
		entries += 1;
		if (entries > 1000 || totalUncompressedBytes > 20 * 1024 * 1024) {
			throw new ChatFileValidationError("Excel workbook expands beyond the safe processing limit.");
		}
		offset += 46 + nameLength + extraLength + commentLength;
	}

	if (entries === 0) throw new ChatFileValidationError("Invalid Excel workbook.");
};

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
	if (type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
		valid = startsWith([0x50, 0x4b, 0x03, 0x04]);
		if (valid) validateZipExpansion(buffer);
	}
	if (type === "text/plain") {
		try {
			const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
			valid = !text.includes("\u0000");
		} catch {
			valid = false;
		}
	}

	if (!valid) throw new ChatFileValidationError("File contents do not match the declared type.");
	return buffer;
}

export async function extractExcelText(bytes) {
	try {
		const sheets = await readXlsxFile(Buffer.from(bytes));
		if (sheets.length > 20) throw new ChatFileValidationError("Excel workbook exceeds 20 sheets.");
		const rows = sheets.flatMap(({ sheet, data }) => [[`Sheet: ${sheet}`], ...data]);
		if (rows.length > 500) throw new ChatFileValidationError("Excel workbook exceeds 500 rows.");
		let cells = 0;
		const textRows = rows.map((row) => {
			if (row.length > 50) throw new ChatFileValidationError("Excel workbook exceeds 50 columns.");
			cells += row.length;
			if (cells > 5000) throw new ChatFileValidationError("Excel workbook exceeds 5,000 cells.");
			return row.map((cell) => String(cell ?? "").replace(/\s+/g, " ").trim()).join("\t");
		});
		return textRows.join("\n").slice(0, 40_000);
	} catch (error) {
		if (error instanceof ChatFileValidationError) throw error;
		throw new ChatFileValidationError("Invalid or unsupported Excel workbook.", { cause: error });
	}
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