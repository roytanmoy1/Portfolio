"use client";
import { useState } from "react";
import styles from "./Header.module.css";
import Link from "next/link";
import { FaSun, FaMoon } from "react-icons/fa";
import { useTheme } from "../ThemeContext";

const Header = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const { darkMode, toggleDarkMode } = useTheme();

	const scrollToSection = (sectionId) => {
		const element = document.getElementById(sectionId);
		if (element) {
			element.scrollIntoView({ behavior: "smooth" });
		}
		setIsMenuOpen(false);
	};

	return (
		<header className={styles.header}>
			<div className={styles.logo}>
				<h1>Tanmoy Roy</h1>
			</div>

			<nav className={`${styles.nav} ${isMenuOpen ? styles.active : ""}`}>
				<ul>
					<li>
						<Link href="#home" onClick={() => scrollToSection("home")}>
							Home
						</Link>
					</li>
					<li>
						<Link href="#about" onClick={() => scrollToSection("about")}>
							About
						</Link>
					</li>
					<li>
						<Link
							href="#experience"
							onClick={() => scrollToSection("experience")}
						>
							Experience
						</Link>
					</li>
					<li>
						<Link href="#skills" onClick={() => scrollToSection("skills")}>
							Skills
						</Link>
					</li>
					<li>
						<Link href="#projects" onClick={() => scrollToSection("projects")}>
							Projects
						</Link>
					</li>
					<li>
						<Link href="#contact" onClick={() => scrollToSection("contact")}>
							Contact
						</Link>
					</li>
				</ul>
			</nav>

			<div className={styles.rightSection}>
				<button
					className={styles.themeToggle}
					onClick={toggleDarkMode}
					aria-label="Toggle theme"
				>
					{darkMode ? <FaSun /> : <FaMoon />}
				</button>

				<div
					className={`${styles.hamburger} ${isMenuOpen ? styles.active : ""}`}
					onClick={() => setIsMenuOpen(!isMenuOpen)}
				>
					<span></span>
					<span></span>
					<span></span>
				</div>
			</div>
		</header>
	);
};

export default Header;
