import { defineConfig } from "@neon/config/v1";

export default defineConfig({
	functions: {
		portfoliochat: {
			name: "Portfolio AI Chat",
			source: "./functions/chat.js",
			env: {
				CHAT_ALLOWED_ORIGINS: process.env.CHAT_ALLOWED_ORIGINS!,
				CHAT_TOKEN_SECRET: process.env.CHAT_TOKEN_SECRET!,
				GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
				GEMINI_MODEL: process.env.GEMINI_MODEL!,
			},
		},
	},
});