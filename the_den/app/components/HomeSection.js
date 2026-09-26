"use client";

import { FaArrowDown, FaEnvelope, FaLinkedinIn, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import Image from "next/image";
import styles from "./Sections.module.css";
import { portfolioData } from "../data/portfolioData";

const HomeSection = ({ id }) => {
	const scrollToAbout = () => {
		document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<section id={id} className={`${styles.section} ${styles.heroSection}`}>
			<div className={styles.sectionInner}>
				<div className={styles.heroGrid}>
					<div className={styles.heroCopy}>
						<p className={styles.eyebrow}>Consultant · Full Stack Engineer</p>
						<h1 className={styles.heroTitle}>
							Building products
							<span className={styles.titleAccent}>people remember.</span>
						</h1>
						<p className={styles.heroLead}>{portfolioData.profile}</p>

						<div className={styles.heroActions}>
							<a
								href={portfolioData.resume}
								download="Tanmoy-Kumar-Roy-Resume.pdf"
								className={styles.primary}
							>
								Download resume <FaArrowDown aria-hidden="true" />
							</a>
							<button type="button" className={styles.secondary} onClick={scrollToAbout}>
								Explore the work
							</button>
						</div>

						<div className={styles.heroLinks}>
							<a className={styles.textLink} href={portfolioData.linkedin} target="_blank" rel="noreferrer">
								LinkedIn
							</a>
							<a className={styles.textLink} href={portfolioData.github} target="_blank" rel="noreferrer">
								GitHub
							</a>
							<a className={styles.textLink} href={portfolioData.leetcode.url} target="_blank" rel="noreferrer">
								LeetCode
						</a>
							<a className={styles.textLink} href="#contact-form">
								Send a message
							</a>
						</div>
					</div>

					<aside className={styles.heroPanel} aria-label="Professional snapshot">
						<div className={styles.availability}>
							<span className={styles.statusDot} aria-hidden="true" />
							Open to meaningful conversations
						</div>

						<div className={styles.panelHeader}>
							<div className={styles.avatar}>
								<Image
									src={portfolioData.photo}
									alt="Tanmoy Kumar Roy standing in front of a waterfall"
									width={96}
									height={96}
									className={styles.avatarImage}
									priority
								/>
							</div>
							<div>
								<p className={styles.panelKicker}>Currently</p>
								<h2 className={styles.panelTitle}>Consultant at Deloitte USI</h2>
							</div>
						</div>

						<div className={styles.statGrid}>
							{portfolioData.highlights.map((stat) => (
								<div className={styles.statCard} key={stat.label}>
									<strong className={styles.statValue}>{stat.value}</strong>
									<span className={styles.statLabel}>{stat.label}</span>
								</div>
							))}
						</div>

						<div className={styles.contactStrip}>
							<a className={styles.contactItem} href="#contact-form">
								<FaEnvelope className={styles.contactIcon} aria-hidden="true" />
								<span className={styles.contactText}>
									<span className={styles.contactLabel}>Email</span>
									{portfolioData.email}
								</span>
							</a>
							<a className={styles.contactItem} href={`tel:${portfolioData.phones[0].replace(/\D/g, "")}`}>
								<FaPhone className={styles.contactIcon} aria-hidden="true" />
								<span className={styles.contactText}>
									<span className={styles.contactLabel}>Call</span>
									{portfolioData.phones[0]}
								</span>
							</a>
							<a className={styles.contactItem} href={portfolioData.linkedin} target="_blank" rel="noreferrer">
								<FaLinkedinIn className={styles.contactIcon} aria-hidden="true" />
								<span className={styles.contactText}>
									<span className={styles.contactLabel}>Profile</span>
									LinkedIn
								</span>
							</a>
							<span className={styles.contactItem}>
								<FaMapMarkerAlt className={styles.contactIcon} aria-hidden="true" />
								<span className={styles.contactText}>
									<span className={styles.contactLabel}>Based in</span>
									{portfolioData.location}
								</span>
							</span>
						</div>
					</aside>
				</div>
			</div>
		</section>
	);
};

export default HomeSection;
