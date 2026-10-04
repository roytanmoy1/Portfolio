const cleanText = (value) => (typeof value === "string" ? value.trim() : "");
const staticFormsEndpoint = "https://api.staticforms.dev/submit";

export async function sendContactEmail({ name, email, message }) {
	const apiKey = cleanText(process.env.STATIC_FORMS_API_KEY);
	if (!apiKey) return { accepted: false, configured: false, provider: null };

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 12_000);
	try {
		const response = await fetch(staticFormsEndpoint, {
			method: "POST",
			headers: { "Content-Type": "application/json", Accept: "application/json" },
			body: JSON.stringify({
				apiKey,
				name,
				email,
				replyTo: email,
				message,
				honeypot: "",
			}),
			signal: controller.signal,
		});
		const result = await response.json().catch(() => ({}));
		if (!response.ok || result.success !== true) {
			const error = new Error("The contact service rejected the submission.");
			error.code = "STATIC_FORMS_REJECTED";
			error.responseCode = response.status;
			throw error;
		}
		return { accepted: true, configured: true, provider: "static-forms" };
	} finally {
		clearTimeout(timeout);
	}
}