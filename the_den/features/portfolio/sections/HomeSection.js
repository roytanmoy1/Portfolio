"use client";

import { FaArrowDown, FaEnvelope, FaExternalLinkAlt, FaLinkedinIn, FaMapMarkerAlt, FaPhone } from "react-icons/fa";
import Image from "next/image";
import styles from "./Sections.module.css";

const HomeSection = ({ id, data }) => {
	const [firstName, ...lastName] = data.name.split(/\s+/);
	const currentRole = data.currentRole;

	return (
		<section id={id} className={`${styles.section} ${styles.heroSection}`}>
			<div className={styles.sectionInner}>
				<div className={styles.heroGrid}>
					<div className={styles.heroCopy}>
						<p className={styles.eyebrow}>{data.title}</p>
						<h1 className={styles.heroTitle}>
							{firstName}
							<span className={styles.titleAccent}>{lastName.join(" ")}</span>
						</h1>
						<p className={styles.heroLead}>{data.profile}</p>

						<div className={styles.heroActions}>
							<a
								href={data.resume}
								download={data.resume.split("/").at(-1)}
								className={styles.primary}
							>
								Download resume <FaArrowDown aria-hidden="true" />
							</a>
							<a href="#experience" className={styles.secondary}>
								Explore the work
							</a>
						</div>

						<div className={styles.heroLinks}>
							<a className={styles.textLink} href={data.linkedin} target="_blank" rel="noreferrer">
								LinkedIn
							</a>
							<a className={styles.textLink} href={data.github} target="_blank" rel="noreferrer">
								GitHub
							</a>
							<a className={styles.textLink} href={data.leetcode.url} target="_blank" rel="noreferrer">
								LeetCode
						</a>
							<a className={styles.textLink} href={`mailto:${data.email}`}>
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
									src={data.photo}
									alt={`${data.name} profile photo`}
									width={96}
									height={96}
									className={styles.avatarImage}
									priority
								/>
							</div>
							<div>
								<p className={styles.panelKicker}>Currently</p>
								<h2 className={styles.panelTitle}>
									{currentRole ? `${currentRole.role} at ${currentRole.company}` : data.title}
								</h2>
							</div>
						</div>

						<div className={styles.statGrid}>
							{data.highlights.map((stat) => (
								<div className={styles.statCard} key={stat.label}>
									<strong className={styles.statValue}>{stat.value}</strong>
									<span className={styles.statLabel}>{stat.label}</span>
								</div>
							))}
						</div>
					</aside>
				</div>

				<div className={styles.heroContactGrid} aria-label="Contact and location">
					<a className={`${styles.contactItem} ${styles.heroContactItem}`} href={`mailto:${data.email}`}>
						<FaEnvelope className={styles.contactIcon} aria-hidden="true" />
						<span className={styles.contactText}>
							<span className={styles.contactLabel}>Email</span>
							{data.email}
						</span>
					</a>
					<a className={`${styles.contactItem} ${styles.heroContactItem}`} href={`tel:${data.phones[0].replace(/\D/g, "")}`}>
						<FaPhone className={styles.contactIcon} aria-hidden="true" />
						<span className={styles.contactText}>
							<span className={styles.contactLabel}>Call</span>
							{data.phones[0]}
						</span>
					</a>
					<a className={`${styles.contactItem} ${styles.heroContactItem}`} href={data.linkedin} target="_blank" rel="noreferrer">
						<FaLinkedinIn className={styles.contactIcon} aria-hidden="true" />
						<span className={styles.contactText}>
							<span className={styles.contactLabel}>Profile</span>
							LinkedIn
						</span>
					</a>
					<a
						className={`${styles.contactItem} ${styles.heroContactItem}`}
						href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.location)}`}
						target="_blank"
						rel="noreferrer"
						aria-label={`View ${data.location} on Google Maps`}
					>
						<FaMapMarkerAlt className={styles.contactIcon} aria-hidden="true" />
						<span className={styles.contactText}>
							<span className={styles.contactLabel}>Location</span>
							{data.location}
						</span>
						<FaExternalLinkAlt className={styles.contactExternalIcon} aria-hidden="true" />
					</a>
				</div>
			</div>
		</section>
	);
};

export default HomeSection;
