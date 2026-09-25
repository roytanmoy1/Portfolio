"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./Header.module.css";
import Link from "next/link";
import Image from "next/image";
import { FaSun, FaMoon } from "react-icons/fa";
import { useTheme } from "../ThemeContext";
import { portfolioData } from "../data/portfolioData";

const navigationItems = [
	{ id: "home", label: "Home" },
	{ id: "about", label: "About" },
	{ id: "experience", label: "Experience" },
	{ id: "skills", label: "Skills" },
	{ id: "projects", label: "Case studies" },
	{ id: "lab", label: "Personal lab" },
	{ id: "contact", label: "Contact" },
];

const Header = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const { darkMode, toggleDarkMode } = useTheme();
	const menuButtonRef = useRef(null);

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
				<Link href="#home" onClick={() => scrollToSection("home")} aria-label="Tanmoy Kumar Roy home">
					<span className={styles.logoMark}>
						<Image
							src={portfolioData.photo}
							alt=""
							width={48}
							height={48}
							className={styles.logoImage}
						/>
					</span>
					<span className={styles.logoText}>
						<strong>Tanmoy</strong>
						<small>Full Stack Engineer</small>
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
