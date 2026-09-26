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
const portfolioPattern = /\b(?:tanmoy(?:'s|s)?|portfolio|resume|experience|career|role|work|company|deloitte|tiger analytics|accenture|projects?|skills?|skillsets?|technology|tech stack|frontend|backend|full stack|cloud|aws|azure|react|node|javascript|postgres|websocket|generative ai|education|college|degree|certification|achievement|leadership|team|leetcode|github|linkedin|contact|email|phone|location|bengaluru|hire|availability|consultant)\b/i;
const greetingPattern = /^(?:hi|hello|hey|good\s+(?:morning|afternoon|evening)|help|what can you do)[!.?\s]*$/i;
const followUpPattern = /^(?:tell me more(?: about (?:that|this|his (?:work|role|project|experience)))?|what about (?:that|this|his (?:work|role|project|experience))|when was that|where was that|which (?:project|role|skill|company)(?: was that)?)\??$/i;
const attachmentPattern = /\b(?:summarize|analyse|analyze|review|explain|compare|extract)\b.{0,80}\b(?:attached|attachment|file|document|spreadsheet|workbook|pdf|text|note)\b/i;
const sensitiveOutputPattern = /\b(?:GEMINI_API_KEY|CHAT_TOKEN_SECRET|process\.env|system prompt|developer message)\b|\bAIza[A-Za-z0-9_-]{20,}\b|\bAQ\.[A-Za-z0-9_-]{16,}\b/i;
const topSkillsPattern = /\b(?:top|main|core)\b.{0,30}\b(?:skills?|skillsets?)\b|\b(?:skills?|skillsets?)\b.{0,30}\b(?:top|main|core)\b/i;
const aiProjectsPattern = /\b(?:which|what|show|list|describe|tell)\b.{0,40}\bprojects?\b.{0,40}\b(?:ai|genai|generative ai)\b|\b(?:ai|genai|generative ai)\b.{0,40}\bprojects?\b/i;
const currentRolePattern = /\b(?:current|present|now)\b.{0,30}\b(?:role|job|position|work)\b|\bwhat does tanmoy do\b/i;
const cloudSkillsPattern = /\b(?:summarize|summary|describe|what are)\b.{0,40}\b(?:cloud|aws|azure)\b.{0,20}\bskills?\b|\bcloud skills?\b/i;
const contactPattern = /\b(?:how|where)\b.{0,25}\b(?:contact|reach|email|call)\b.{0,20}\btanmoy\b|\bcontact details?\b/i;

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

export function redactChatLogText(value) {
	return normalizeChatMessage(value)
		.replace(/\b(?:AIza|AQ\.)[A-Za-z0-9._-]{12,}\b/g, "[REDACTED_KEY]")
		.replace(/\b(api\s*key|access\s*token|password|secret)\s*[:=]\s*\S+/gi, "$1=[REDACTED]");
}

export function getDirectPortfolioResponse(message, { visitorName, portfolioData }) {
	if (greetingPattern.test(message)) {
		return `Hi ${visitorName}. I can help with Tanmoy's experience, skills, projects, certifications, and contact details.`;
	}
	if (topSkillsPattern.test(message)) {
		const groups = portfolioData.skills.map((group) => {
			const strongest = [...group.items]
				.sort((first, second) => second.level - first.level)
				.slice(0, 3)
				.map((skill) => skill.name)
				.join(", ");
			return `${group.category} (${strongest})`;
		});
		return `Tanmoy's four core skill groups are: ${groups.join("; ")}.`;
	}
	if (aiProjectsPattern.test(message)) {
		const projects = portfolioData.projects.filter((project) =>
			JSON.stringify(project).match(/\b(?:ai|genai|generative|llm|conversational)\b/i)
		);
		return projects.length
			? `The strongest AI examples are ${projects.map((project) => `${project.title} (${project.client})`).join(", ")}. These cover conversational agents, LLM workflows, file intelligence, and AI-assisted enterprise operations.`
			: "The public portfolio does not list a dedicated AI project.";
	}
	if (currentRolePattern.test(message)) {
		const current = portfolioData.experience.find((role) => role.current) || portfolioData.experience[0];
		return `Tanmoy is currently ${current.role} at ${current.company} in ${current.location}, since ${current.dates.split("—")[0].trim()}. ${current.summary}`;
	}
	if (cloudSkillsPattern.test(message)) {
		const cloud = portfolioData.skills.find((group) => group.category.includes("Cloud"));
		return `Tanmoy's cloud toolkit includes ${cloud.items.map((skill) => skill.name).join(", ")}. His work covers serverless systems, CI/CD, messaging, and Azure solution architecture.`;
	}
	if (contactPattern.test(message)) {
		return `You can reach Tanmoy at ${portfolioData.email}, connect on LinkedIn at ${portfolioData.linkedin}, or call ${portfolioData.phones[0]}.`;
	}
	return null;
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
			items: items.map(({ name, level }) => ({ name, level })),
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