import nodemailer from "nodemailer";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

const getMailConfiguration = () => {
	const host = cleanText(process.env.SMTP_HOST);
	const port = Number(process.env.SMTP_PORT || 465);
	const user = cleanText(process.env.SMTP_USER);
	const password = cleanText(process.env.SMTP_PASS);
	const to = cleanText(process.env.CONTACT_TO_EMAIL) || user;
	const from = cleanText(process.env.SMTP_FROM_EMAIL) || user;
	const secureSetting = cleanText(process.env.SMTP_SECURE);

	if (
		!host ||
		!Number.isInteger(port) ||
		port < 1 ||
		port > 65535 ||
		!user ||
		!password ||
		!emailPattern.test(to) ||
		!emailPattern.test(from)
	) {
		return null;
	}

	return {
		from,
		host,
		password,
		port,
		secure: secureSetting ? secureSetting === "true" : port === 465,
		to,
		user,
	};
};

export async function sendContactEmail({ name, email, message }) {
	const mail = getMailConfiguration();
	if (!mail) return { accepted: false, configured: false };

	const transporter = nodemailer.createTransport({
		host: mail.host,
		port: mail.port,
		secure: mail.secure,
		auth: {
			user: mail.user,
			pass: mail.password,
		},
		connectionTimeout: 10_000,
		greetingTimeout: 10_000,
		socketTimeout: 15_000,
		disableFileAccess: true,
		disableUrlAccess: true,
		tls: { minVersion: "TLSv1.2" },
	});
	const delivery = await transporter.sendMail({
		from: { name: "Tanmoy Roy Portfolio", address: mail.from },
		to: mail.to,
		replyTo: { name, address: email },
		subject: `Portfolio enquiry from ${name}`,
		text: [
			"New portfolio enquiry",
			"",
			`Name: ${name}`,
			`Email: ${email}`,
			"",
			"Message:",
			message,
			"",
			`Submitted: ${new Date().toISOString()}`,
		].join("\n"),
	});

	return { accepted: Boolean(delivery.accepted?.length), configured: true };
}