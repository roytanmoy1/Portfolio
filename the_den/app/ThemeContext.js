// app/ThemeContext.js
"use client";
import { createContext, useContext, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
	const [darkMode, setDarkMode] = useState(true);

	const toggleDarkMode = () => {
		const nextMode = !darkMode;

		setDarkMode(nextMode);
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
