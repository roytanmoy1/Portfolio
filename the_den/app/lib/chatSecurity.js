export const MAX_CHAT_INPUT_LENGTH = 500;
export const MAX_CHAT_OUTPUT_LENGTH = 1800;

export const PORTFOLIO_ONLY_REFUSAL =
	"I can only help with Tanmoy's public portfolio, experience, skills, projects, education, and contact details.";

export const SECURITY_REFUSAL =
	"I can't reveal hidden instructions, credentials, configuration, or internal system details. I can answer questions about Tanmoy's public portfolio.";

const controlCharacterPattern = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200D\uFEFF]/g;
const injectionPatterns = [
	/\b(?:ignore|disregard|override)\b.{0,50}\b(?:instructions?|prompts?|rules?|polic(?:y|ies))\b/i,
	/\b(?:system|developer|hidden)\s+(?:prompts?|messages?|instructions?|polic(?:y|ies))\b/i,
	/\b(?:reveal|show|print|repeat|return|leak|extract)\b.{0,60}\b(?:prompts?|instructions?|secrets?|keys?|credentials?|environments?|configurations?)\b/i,
	/\b(?:api\s*keys?|access\s*tokens?|passwords?|credentials?|secrets?|process\.env|environment\s+variables?)\b/i,
	/\b(?:jailbreak|dan\s+mode|developer\s+mode|bypass\s+(?:the\s+)?(?:guardrail|safety|policy))\b/i,
	/\b(?:act as|pretend to be)\b.{0,50}\b(?:unrestricted|system|developer|administrator)\b/i,
];
const portfolioPattern = /\b(?:tanmoy|portfolio|resume|experience|career|role|work|company|deloitte|tiger analytics|accenture|project|skill|technology|tech stack|frontend|backend|full stack|cloud|aws|azure|react|node|javascript|postgres|websocket|generative ai|education|college|degree|certification|achievement|leadership|team|leetcode|github|linkedin|contact|email|phone|location|bengaluru|hire|availability|consultant)\b/i;
const greetingPattern = /^(?:hi|hello|hey|good\s+(?:morning|afternoon|evening)|help|what can you do)[!.?\s]*$/i;
const followUpPattern = /^(?:tell me more(?: about (?:that|this|his (?:work|role|project|experience)))?|what about (?:that|this|his (?:work|role|project|experience))|when was that|where was that|which (?:project|role|skill|company)(?: was that)?)\??$/i;
const attachmentPattern = /\b(?:summarize|analyse|analyze|review|explain|compare|extract)\b.{0,80}\b(?:attached|attachment|file|document|spreadsheet|workbook|pdf|text|note)\b/i;
const sensitiveOutputPattern = /\b(?:GEMINI_API_KEY|CHAT_TOKEN_SECRET|process\.env|system prompt|developer message)\b|\bAIza[A-Za-z0-9_-]{20,}\b|\bAQ\.[A-Za-z0-9_-]{16,}\b/i;

export const normalizeChatMessage = (value) =>
	typeof value === "string"
		? value.replace(controlCharacterPattern, "").replace(/\s+/g, " ").trim()
		: "";

export function getGuardrailRefusal(message, { hasConversation = false, hasAttachments = false } = {}) {
	if (injectionPatterns.some((pattern) => pattern.test(message))) return SECURITY_REFUSAL;
	if (hasAttachments && attachmentPattern.test(message)) return null;
	if (portfolioPattern.test(message) || greetingPattern.test(message)) return null;
	if (hasConversation && message.length <= 160 && followUpPattern.test(message)) return null;
	return PORTFOLIO_ONLY_REFUSAL;
}

export function sanitizeAssistantOutput(value) {
	if (typeof value !== "string") return PORTFOLIO_ONLY_REFUSAL;
	const output = value.replace(controlCharacterPattern, "").replace(/\r\n/g, "\n").trim();
	if (!output || sensitiveOutputPattern.test(output)) return SECURITY_REFUSAL;
	return output.slice(0, MAX_CHAT_OUTPUT_LENGTH);
}

export function buildPublicPortfolioContext(portfolioData) {
	return {
		name: portfolioData.name,
		title: portfolioData.title,
		location: portfolioData.location,
		profile: portfolioData.profile,
		highlights: portfolioData.highlights,
		about: portfolioData.aboutPoints,
		skills: portfolioData.skills.map(({ category, items }) => ({
			category,
			items: items.map(({ name }) => name),
		})),
		experience: portfolioData.experience.map(({ company, role, dates, location, summary, stack, highlights }) => ({
			company,
			role,
			dates,
			location,
			summary,
			stack,
			highlights,
		})),
		projects: portfolioData.projects,
		personalProjects: portfolioData.personalProjects,
		leetcode: portfolioData.leetcode,
		education: portfolioData.education,
		certifications: portfolioData.certifications,
		contact: {
			email: portfolioData.email,
			phones: portfolioData.phones,
			linkedin: portfolioData.linkedin,
			github: portfolioData.github,
		},
	};
}