import assert from "node:assert/strict";
import {
	getContactFieldValidationError,
	getContactValidationError,
	normalizeContactFields,
} from "../features/contact/contactValidation.js";

process.env.DATABASE_URL = "";
process.env.STATIC_FORMS_API_KEY = "staticforms-test-key";

const normalizedContact = normalizeContactFields({
	name: "  Test   Visitor ",
	email: "VISITOR@example.com ",
	message: " A portfolio contact test message. ",
});
assert.deepEqual(normalizedContact, {
	name: "Test Visitor",
	email: "visitor@example.com",
	message: "A portfolio contact test message.",
	company: "",
});
assert.equal(getContactValidationError(normalizedContact), null);
assert.equal(getContactFieldValidationError("name", "A"), "Please enter a name between 2 and 80 characters.");
assert.equal(getContactFieldValidationError("email", "invalid"), "Please enter a valid email address.");
assert.equal(getContactFieldValidationError("message", "short"), "Please enter a message between 10 and 4000 characters.");
assert.equal(
	getContactValidationError(normalizeContactFields({ name: "A", email: "invalid", message: "short" })),
	"Please provide a valid name, email, and message."
);

const originalFetch = globalThis.fetch;
let failProviderRequest = false;
let providerRequestCount = 0;
globalThis.fetch = async (url, options) => {
	providerRequestCount += 1;
	assert.equal(url, "https://api.staticforms.dev/submit");
	assert.equal(options.method, "POST");
	assert.deepEqual(JSON.parse(options.body), {
		apiKey: "staticforms-test-key",
		name: "Test Visitor",
		email: "visitor@example.com",
		replyTo: "visitor@example.com",
		message: "A portfolio contact test message.",
		honeypot: "",
	});
	if (failProviderRequest) {
		return Response.json({ success: false, message: "Invalid API key" }, { status: 401 });
	}
	return Response.json({ success: true, message: "Form submission received" }, { status: 200 });
};

try {
	const { sendContactEmail } = await import(`../features/contact/contactMailer.js?test=${Date.now()}`);
	const delivery = await sendContactEmail(normalizedContact);
	assert.deepEqual(delivery, { accepted: true, configured: true, provider: "static-forms" });
	assert.equal(providerRequestCount, 1);

	failProviderRequest = true;
	await assert.rejects(
		sendContactEmail(normalizedContact),
		(error) => error.code === "STATIC_FORMS_REJECTED" && error.responseCode === 401
	);
	assert.equal(providerRequestCount, 2);

	delete process.env.STATIC_FORMS_API_KEY;
	let calledWithoutKey = false;
	globalThis.fetch = async () => {
		calledWithoutKey = true;
		return Response.json({ success: true });
	};
	const unconfiguredDelivery = await sendContactEmail(normalizedContact);
	assert.deepEqual(unconfiguredDelivery, { accepted: false, configured: false, provider: null });
	assert.equal(calledWithoutKey, false);
	console.log("Contact validation and Static Forms provider contract verified.");
} finally {
	globalThis.fetch = originalFetch;
}
