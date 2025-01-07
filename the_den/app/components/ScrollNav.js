import { useState, useEffect } from "react";
import styles from "./ScrollNav.module.css";

const SectionNav = () => {
	const [activeSection, setActiveSection] = useState("");

	const sections = [
		{ id: "home", label: "Home" },
		{ id: "about", label: "About" },
		{ id: "experience", label: "Experience" },
		{ id: "skills", label: "Skills" },
		{ id: "projects", label: "Projects" },
		{ id: "contact", label: "Contact" },
	];

	useEffect(() => {
		const observerOptions = {
			root: null,
			rootMargin: "-10% 0px -10% 0px",
			threshold: [0.1, 0.5], // Lower threshold for better detection
		};

		const handleIntersect = (entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					setActiveSection(entry.target.id);
					console.log("Active section:", entry.target.id); // Debug log
				}
			});
		};

		const observer = new IntersectionObserver(handleIntersect, observerOptions);

		// Add a small delay to ensure DOM elements are mounted
		setTimeout(() => {
			sections.forEach(({ id }) => {
				const element = document.getElementById(id);
				if (element) {
					observer.observe(element);
					console.log(`Observing section: ${id}`);
				} else {
					console.warn(`Section with id "${id}" not found`);
				}
			});
		}, 100);

		return () => observer.disconnect();
	}, []);

	const handleClick = (e, id) => {
		e.preventDefault();
		const element = document.getElementById(id);
		if (element) {
			const headerHeight = 60; // Adjust based on your header height
			const elementPosition = element.getBoundingClientRect().top;
			const offsetPosition =
				elementPosition + window.pageYOffset - headerHeight;

			window.scrollTo({
				top: offsetPosition,
				behavior: "smooth",
			});
		}
	};

	return (
		<nav className={styles.sectionNav} aria-label="Section navigation">
			<ul className={styles.navList}>
				{sections.map(({ id, label }) => (
					<li key={id} className={styles.navItem}>
						<a
							href={`#${id}`}
							onClick={(e) => handleClick(e, id)}
							className={`${styles.navLink} ${
								activeSection === id ? styles.active : ""
							}`}
							// aria-current={activeSection === id ? "true" : "false"}
						>
							{label}
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
};

export default SectionNav;
