"use client";

import { useEffect, useRef, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import styles from "./ScrollNav.module.css";

const sections = [
	{ id: "home", label: "Home" },
	{ id: "about", label: "About" },
	{ id: "experience", label: "Experience" },
	{ id: "skills", label: "Skills" },
	{ id: "projects", label: "Case studies" },
	{ id: "lab", label: "Personal lab" },
	{ id: "contact", label: "Contact" },
];

const SectionNav = () => {
	const [activeSection, setActiveSection] = useState("home");
	const [isExpanded, setIsExpanded] = useState(false);
	const collapseTimer = useRef(null);

	const keepOpen = () => {
		if (collapseTimer.current) clearTimeout(collapseTimer.current);
	};

	const collapseSoon = () => {
		if (collapseTimer.current) clearTimeout(collapseTimer.current);
		collapseTimer.current = setTimeout(() => setIsExpanded(false), 2400);
	};

	useEffect(() => {
		const elements = sections
			.map(({ id }) => document.getElementById(id))
			.filter(Boolean);

		if (!elements.length) return undefined;

		const observer = new IntersectionObserver(
			(entries) => {
				const visibleEntry = entries
					.filter((entry) => entry.isIntersecting)
					.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

				if (visibleEntry) setActiveSection(visibleEntry.target.id);
			},
			{ rootMargin: "-18% 0px -58% 0px", threshold: [0.05, 0.25, 0.5] }
		);

		elements.forEach((element) => observer.observe(element));
		return () => observer.disconnect();
	}, []);

	useEffect(() => () => {
		if (collapseTimer.current) clearTimeout(collapseTimer.current);
	}, []);

	return (
		<nav
			className={`${styles.sectionNav} ${isExpanded ? styles.expanded : ""}`}
			aria-label="Section navigation"
			onMouseEnter={keepOpen}
			onMouseLeave={collapseSoon}
			onFocusCapture={keepOpen}
			onBlurCapture={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget)) collapseSoon();
			}}
		>
			<button
				type="button"
				className={styles.navToggle}
				onClick={() => setIsExpanded((current) => !current)}
				aria-expanded={isExpanded}
				aria-label={isExpanded ? "Collapse section navigation" : "Expand section navigation"}
			>
				{isExpanded ? <FaChevronRight aria-hidden="true" /> : <FaChevronLeft aria-hidden="true" />}
				<span className={styles.srOnly}>{isExpanded ? "Collapse" : "Expand"}</span>
			</button>
			<span className={styles.navLabel}>Explore</span>
			<ul className={styles.navList}>
				{sections.map(({ id, label }) => (
					<li key={id} className={styles.navItem}>
						<a
							href={`#${id}`}
							title={label}
							className={`${styles.navLink} ${activeSection === id ? styles.active : ""}`}
							aria-current={activeSection === id ? "location" : undefined}
						>
							<span className={styles.navDot} aria-hidden="true" />
							<span className={styles.navText}>{label}</span>
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
};

export default SectionNav;
