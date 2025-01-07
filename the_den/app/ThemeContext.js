// app/ThemeContext.js
"use client";
import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
	const [darkMode, setDarkMode] = useState(false);

	useEffect(() => {
		const isDark = localStorage.getItem("darkMode") === "true";
		setDarkMode(isDark);
		document.documentElement.classList.toggle("dark", isDark);
	}, []);

	const toggleDarkMode = () => {
		setDarkMode(!darkMode);
		localStorage.setItem("darkMode", !darkMode);
		document.documentElement.classList.toggle("dark");
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
