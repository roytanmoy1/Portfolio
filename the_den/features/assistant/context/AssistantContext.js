"use client";

import { createContext, useContext, useState, useSyncExternalStore } from "react";

const AssistantContext = createContext(null);
const mobileLayoutQuery = "(max-width: 700px)";

const subscribeToMobileLayout = (onStoreChange) => {
	const mediaQuery = window.matchMedia(mobileLayoutQuery);
	mediaQuery.addEventListener("change", onStoreChange);
	return () => mediaQuery.removeEventListener("change", onStoreChange);
};

const getMobileLayoutSnapshot = () => window.matchMedia(mobileLayoutQuery).matches;
const getServerMobileLayoutSnapshot = () => true;

export function AssistantProvider({ children }) {
	const isMobileLayout = useSyncExternalStore(
		subscribeToMobileLayout,
		getMobileLayoutSnapshot,
		getServerMobileLayoutSnapshot
	);
	const [assistantOpenOverride, setAssistantOpenOverride] = useState(null);
	const isAssistantOpen = assistantOpenOverride ?? !isMobileLayout;

	return (
		<AssistantContext.Provider
			value={{
				isAssistantOpen,
				closeAssistant: () => setAssistantOpenOverride(false),
				toggleAssistant: () => setAssistantOpenOverride((current) => !(current ?? !isMobileLayout)),
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