"use client";
import styles from "./page.module.css";
import Header from "./components/Header";
import HomeSection from "./components/HomeSection";
import AboutSection from "./components/AboutSection";
import ExperienceSection from "./components/ExperienceSection";
import SkillsSection from "./components/SkillsSection";
import ProjectsSection from "./components/ProjectsSection";
import LabSection from "./components/LabSection";
import ContactSection from "./components/ContactSection";
import SectionNav from "./components/ScrollNav";

export default function Home() {
	return (
		<div className={styles.container}>
			<div className={styles.ambientGlow} aria-hidden="true" />
			<div className={styles.gridOverlay} aria-hidden="true" />
			<a className={styles.skipLink} href="#main-content">
				Skip to main content
			</a>
			<Header />
			<main id="main-content" className={styles.main}>
				<HomeSection id="home" />
				<AboutSection id="about" />
				<ExperienceSection id="experience" />
				<SkillsSection id="skills" />
				<ProjectsSection id="projects" />
				<LabSection id="lab" />
				<ContactSection id="contact" />
			</main>
			<SectionNav />
		</div>
	);
}
