"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./Header.module.css";
import Link from "next/link";
import Image from "next/image";
import { FaSun, FaMoon, FaRobot } from "react-icons/fa";
import { useTheme } from "../theme/ThemeContext";
import { useAssistant } from "../assistant/context/AssistantContext";

const navigationItems = [
	{ id: "home", label: "Home" },
	{ id: "experience", label: "Experience" },
	{ id: "skills", label: "Skills" },
	{ id: "about", label: "Profile" },
	{ id: "lab", label: "Personal lab" },
	{ id: "contact", label: "Contact" },
];

const Header = ({ home }) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const { darkMode, toggleDarkMode } = useTheme();
	const { isAssistantOpen, toggleAssistant } = useAssistant();
	const menuButtonRef = useRef(null);
	const assistantButtonRef = useRef(null);
	const wasAssistantOpenRef = useRef(isAssistantOpen);

	useEffect(() => {
		if (wasAssistantOpenRef.current && !isAssistantOpen) assistantButtonRef.current?.focus();
		wasAssistantOpenRef.current = isAssistantOpen;
	}, [isAssistantOpen]);

	useEffect(() => {
		if (!isMenuOpen) return undefined;

		const handleKeyDown = (event) => {
			if (event.key === "Escape") {
				setIsMenuOpen(false);
				menuButtonRef.current?.focus();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isMenuOpen]);

	const scrollToSection = (sectionId) => {
		const element = document.getElementById(sectionId);
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "start" });
		}
		setIsMenuOpen(false);
	};

	return (
		<header className={styles.header}>
			<div className={styles.logo}>
				<Link href="#home" onClick={() => scrollToSection("home")} aria-label={`${home.name} home`}>
					<span className={styles.logoMark}>
						<Image
							src={home.photo}
							alt=""
							width={48}
							height={48}
							className={styles.logoImage}
						/>
					</span>
					<span className={styles.logoText}>
						<strong>{home.shortName}</strong>
						<small>{home.title}</small>
					</span>
				</Link>
			</div>

			<nav
				id="primary-navigation"
				className={`${styles.nav} ${isMenuOpen ? styles.active : ""}`}
				aria-label="Primary navigation"
			>
				<ul>
					{navigationItems.map((item) => (
						<li key={item.id}>
							<Link
								href={`#${item.id}`}
								onClick={() => scrollToSection(item.id)}
							>
								{item.label}
							</Link>
						</li>
					))}
				</ul>
			</nav>

			<div className={styles.rightSection}>
				<button
					ref={assistantButtonRef}
					className={`${styles.assistantToggle} ${isAssistantOpen ? styles.active : ""}`}
					onClick={() => {
						setIsMenuOpen(false);
						toggleAssistant();
					}}
					aria-label={isAssistantOpen ? `Close ${home.assistantName}` : `Open ${home.assistantName}`}
					aria-expanded={isAssistantOpen}
					aria-controls="portfolio-assistant"
					title={home.assistantName}
					type="button"
				>
					<FaRobot aria-hidden="true" />
				</button>

				<button
					className={styles.themeToggle}
					onClick={toggleDarkMode}
					aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
					type="button"
				>
					{darkMode ? <FaSun /> : <FaMoon />}
				</button>

				<button
					type="button"
					ref={menuButtonRef}
					className={`${styles.hamburger} ${isMenuOpen ? styles.active : ""}`}
					onClick={() => setIsMenuOpen(!isMenuOpen)}
					aria-label={isMenuOpen ? "Close menu" : "Open menu"}
					aria-expanded={isMenuOpen}
					aria-controls="primary-navigation"
				>
					<span></span>
					<span></span>
					<span></span>
				</button>
			</div>
		</header>
	);
};

export default Header;
