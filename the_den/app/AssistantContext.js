"use client";

import { createContext, useContext, useState } from "react";

const AssistantContext = createContext(null);

export function AssistantProvider({ children }) {
	const [isAssistantOpen, setIsAssistantOpen] = useState(false);

	return (
		<AssistantContext.Provider
			value={{
				isAssistantOpen,
				closeAssistant: () => setIsAssistantOpen(false),
				toggleAssistant: () => setIsAssistantOpen((current) => !current),
			}}
		>
			{children}
		</AssistantContext.Provider>
	);
}

export function useAssistant() {
	const context = useContext(AssistantContext);
	if (!context) throw new Error("useAssistant must be used within AssistantProvider.");
	return context;
}