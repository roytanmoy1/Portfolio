"use client";

import { useEffect, useState } from "react";
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

	return (
		<nav className={styles.sectionNav} aria-label="Section navigation">
			<span className={styles.navLabel}>Explore</span>
			<ul className={styles.navList}>
				{sections.map(({ id, label }) => (
					<li key={id} className={styles.navItem}>
						<a
							href={`#${id}`}
							className={`${styles.navLink} ${activeSection === id ? styles.active : ""}`}
							aria-current={activeSection === id ? "location" : undefined}
						>
							<span className={styles.navDot} aria-hidden="true" />
							{label}
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
};

export default SectionNav;
