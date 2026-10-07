"use client";
import styles from "./PortfolioPage.module.css";
import { AssistantProvider, useAssistant } from "../assistant/context/AssistantContext";
import ChatPanel from "../assistant/components/ChatPanel";
import Header from "../navigation/Header";
import AboutSection from "./sections/AboutSection";
import ContactSection from "./sections/ContactSection";
import ExperienceSection from "./sections/ExperienceSection";
import HomeSection from "./sections/HomeSection";
import LabSection from "./sections/LabSection";
import SkillsSection from "./sections/SkillsSection";

const PortfolioContent = ({ initialHome }) => {
	const { isAssistantOpen } = useAssistant();

	return (
		<div className={`${styles.container} ${isAssistantOpen ? styles.assistantOpen : ""}`}>
			<div className={styles.ambientGlow} aria-hidden="true" />
			<div className={styles.starField} aria-hidden="true" />
			<a className={styles.skipLink} href="#main-content">
				Skip to main content
			</a>
			<Header home={initialHome} />
			<main id="main-content" className={styles.main}>
				<HomeSection id="home" data={initialHome} />
				<ExperienceSection id="experience" />
				<SkillsSection id="skills" />
				<AboutSection id="about" />
				<LabSection id="lab" />
				<ContactSection id="contact" home={initialHome} />
			</main>
			<ChatPanel home={initialHome} />
		</div>
	);
};

export default function Home({ initialHome }) {
	return (
		<AssistantProvider>
			<PortfolioContent initialHome={initialHome} />
		</AssistantProvider>
	);
}
