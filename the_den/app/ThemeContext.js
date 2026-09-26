// app/ThemeContext.js
"use client";
import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
	const [darkMode, setDarkMode] = useState(true);

	useEffect(() => {
		const savedMode = localStorage.getItem("darkMode");
		const isDark = savedMode === null ? true : savedMode === "true";

		setDarkMode(isDark);
		document.documentElement.classList.toggle("dark", isDark);
		document.documentElement.classList.toggle("light", !isDark);
	}, []);

	const toggleDarkMode = () => {
		const nextMode = !darkMode;

		setDarkMode(nextMode);
		localStorage.setItem("darkMode", String(nextMode));
		document.documentElement.classList.toggle("dark", nextMode);
		document.documentElement.classList.toggle("light", !nextMode);
	};

	return (
		<ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	return useContext(ThemeContext);
}
