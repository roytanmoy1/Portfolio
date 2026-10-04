export const CONTACT_LIMITS = Object.freeze({
	nameMin: 2,
	nameMax: 80,
	emailMax: 254,
	messageMin: 10,
	messageMax: 4000,
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const controlCharacterPattern = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\uFEFF]/;

export function getContactFieldValidationError(field, value) {
	if (typeof value !== "string") return "Please enter a valid value.";
	if (controlCharacterPattern.test(value)) return "Please remove unusual characters and try again.";

	switch (field) {
		case "name":
			if (value.length < CONTACT_LIMITS.nameMin || value.length > CONTACT_LIMITS.nameMax) {
				return `Please enter a name between ${CONTACT_LIMITS.nameMin} and ${CONTACT_LIMITS.nameMax} characters.`;
			}
			return null;
		case "email":
			if (value.length > CONTACT_LIMITS.emailMax || !emailPattern.test(value)) {
				return "Please enter a valid email address.";
			}
			return null;
		case "message":
			if (value.length < CONTACT_LIMITS.messageMin || value.length > CONTACT_LIMITS.messageMax) {
				return `Please enter a message between ${CONTACT_LIMITS.messageMin} and ${CONTACT_LIMITS.messageMax} characters.`;
			}
			return null;
		default:
			return "Please enter a valid value.";
	}
}

export function normalizeContactFields(value) {
	const fields = value && typeof value === "object" && !Array.isArray(value) ? value : {};
	return {
		name: typeof fields.name === "string" ? fields.name.trim().replace(/\s+/g, " ") : "",
		email: typeof fields.email === "string" ? fields.email.trim().toLowerCase() : "",
		message: typeof fields.message === "string" ? fields.message.trim() : "",
		company: typeof fields.company === "string" ? fields.company.trim() : "",
	};
}

export function getContactValidationError({ name, email, message }) {
	if (
		getContactFieldValidationError("name", name) ||
		getContactFieldValidationError("email", email) ||
		getContactFieldValidationError("message", message)
	) {
		return "Please provide a valid name, email, and message.";
	}
	return null;
}