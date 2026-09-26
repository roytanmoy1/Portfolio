"use client";
import styles from "./page.module.css";
import Header from "./components/Header";
import HomeSection from "./components/HomeSection";
import AboutSection from "./components/AboutSection";
import ExperienceSection from "./components/ExperienceSection";
import SkillsSection from "./components/SkillsSection";
import LabSection from "./components/LabSection";
import ContactSection from "./components/ContactSection";
import ChatPanel from "./components/ChatPanel";
import { AssistantProvider } from "./AssistantContext";

export default function Home() {
	return (
		<AssistantProvider>
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
					<LabSection id="lab" />
					<ContactSection id="contact" />
				</main>
				<ChatPanel />
			</div>
		</AssistantProvider>
	);
}
