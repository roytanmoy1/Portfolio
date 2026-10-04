import assert from "node:assert/strict";
import net from "node:net";
import { getContactFieldValidationError, getContactValidationError, normalizeContactFields } from "../features/contact/contactValidation.js";

process.env.DATABASE_URL = "";
process.env.SMTP_HOST = "127.0.0.1";
process.env.SMTP_PORT = "2526";
process.env.SMTP_SECURE = "false";
process.env.SMTP_USER = "smtp-test";
process.env.SMTP_PASS = "smtp-test-password";
process.env.SMTP_FROM_EMAIL = "portfolio@example.com";
process.env.CONTACT_TO_EMAIL = "owner@example.com";

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

const messages = [];
const sockets = new Set();
let rejectAuthentication = false;
const server = net.createServer((socket) => {
	sockets.add(socket);
	socket.on("close", () => sockets.delete(socket));
	socket.setEncoding("utf8");
	socket.write("220 localhost ESMTP\r\n");

	let buffer = "";
	let receivingData = false;

	socket.on("data", (chunk) => {
		buffer += chunk;

		while (buffer.length) {
			if (receivingData) {
				const end = buffer.indexOf("\r\n.\r\n");
				if (end === -1) return;

				messages.push(buffer.slice(0, end));
				buffer = buffer.slice(end + 5);
				receivingData = false;
				socket.write("250 2.0.0 queued\r\n");
				continue;
			}

			const end = buffer.indexOf("\r\n");
			if (end === -1) return;

			const line = buffer.slice(0, end);
			buffer = buffer.slice(end + 2);

			if (line.startsWith("EHLO")) {
				socket.write("250-localhost\r\n250 AUTH PLAIN\r\n");
			} else if (line.startsWith("AUTH PLAIN")) {
				socket.write(rejectAuthentication
					? "535 5.7.8 Authentication credentials invalid\r\n"
					: "235 2.7.0 authenticated\r\n");
			} else if (line.startsWith("MAIL FROM") || line.startsWith("RCPT TO")) {
				socket.write("250 2.1.0 accepted\r\n");
			} else if (line === "DATA") {
				receivingData = true;
				socket.write("354 End data with <CR><LF>.<CR><LF>\r\n");
			} else if (line === "QUIT") {
				socket.end("221 2.0.0 bye\r\n");
			} else {
				socket.write("250 2.0.0 ok\r\n");
			}
		}
	});
});

await new Promise((resolve) => server.listen(2526, "127.0.0.1", resolve));

try {
	const { sendContactEmail } = await import(`../features/contact/contactMailer.js?test=${Date.now()}`);
	const delivery = await sendContactEmail({
		name: "SMTP Test",
		email: "visitor@example.com",
		message: "This verifies authenticated SMTP delivery.",
	});
	const message = messages[0] || "";

	assert.deepEqual(delivery, { accepted: true, configured: true, provider: "smtp" });
	assert.equal(messages.length, 1);
	assert.match(message, /To: owner@example\.com/);
	assert.match(message, /Reply-To: SMTP Test <visitor@example\.com>/);
	assert.match(message, /Subject: Portfolio enquiry from SMTP Test/);

	rejectAuthentication = true;
	await assert.rejects(
		sendContactEmail({
			name: "SMTP Test",
			email: "visitor@example.com",
			message: "This verifies authenticated SMTP delivery.",
		}),
		(error) => error.code === "EAUTH"
	);
	assert.equal(messages.length, 1);

	process.env.SMTP_HOST = "";
	const unconfiguredDelivery = await sendContactEmail({
		name: "SMTP Test",
		email: "visitor@example.com",
		message: "This verifies authenticated SMTP delivery.",
	});
	assert.deepEqual(unconfiguredDelivery, { accepted: false, configured: false, provider: null });
	console.log("Contact normalization, SMTP acceptance, authentication rejection, and missing configuration verified.");
} finally {
	for (const socket of sockets) socket.destroy();
	await new Promise((resolve) => server.close(resolve));
}