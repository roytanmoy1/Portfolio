import { FaChartLine } from "react-icons/fa";
import styles from "./Sections.module.css";
import { portfolioData } from "../data/portfolioData";

const AboutSection = ({ id }) => {
	return (
		<section id={id} className={styles.section}>
			<div className={styles.sectionInner}>
				<div className={styles.sectionHeading}>
					<p className={styles.sectionEyebrow}>Profile</p>
					<h2 className={styles.sectionTitle}>Product delivery across architecture and engineering.</h2>
				</div>

				<div className={styles.aboutGrid}>
					<div className={styles.aboutIntro}>
						<p>
							I work across product discovery, architecture, and delivery. Recent projects include
							<strong> enterprise analytics, conversational AI, and cloud-native services</strong>.
						</p>
					</div>

					<div className={styles.aboutPoints}>
						{portfolioData.aboutPoints.map((point, index) => (
							<article className={styles.aboutPoint} key={point.label}>
								<span className={styles.pointNumber}>{String(index + 1).padStart(2, "0")}</span>
								<div className={styles.pointContent}>
									<strong className={styles.pointLabel}>{point.label}</strong>
									<p>{point.text}</p>
								</div>
							</article>
						))}
					</div>
				</div>

				<div className={styles.educationGrid}>
					<article className={styles.educationCard}>
						<p className={styles.educationLabel}>Education</p>
						<h3 className={styles.educationTitle}>{portfolioData.education.degree}</h3>
						<p className={styles.educationText}>
							{portfolioData.education.institution} · {portfolioData.education.years}<br />
							{portfolioData.education.discipline} · {portfolioData.education.result}
						</p>
					</article>
					<article className={styles.educationCard}>
						<p className={styles.educationLabel}>Certifications</p>
						<div className={styles.certificationList}>
							{portfolioData.certifications.map((certification) => (
								<span className={styles.certification} key={certification}>{certification}</span>
							))}
						</div>
					</article>
					<article className={`${styles.educationCard} ${styles.leetcodeProfileCard}`}>
						<div className={styles.labCardHeader}>
							<span className={styles.labIcon} aria-hidden="true"><FaChartLine /></span>
							<div>
								<p className={styles.educationLabel}>Problem solving</p>
								<h3 className={styles.educationTitle}>LeetCode · {portfolioData.leetcode.username}</h3>
							</div>
						</div>
						<div className={styles.leetcodeStats}>
							<div><strong>{portfolioData.leetcode.solved}</strong><span>solved</span></div>
							<div><strong>{portfolioData.leetcode.acceptance}</strong><span>acceptance</span></div>
							<div><strong>{portfolioData.leetcode.rank}</strong><span>global rank</span></div>
						</div>
						<a className={styles.projectLink} href={portfolioData.leetcode.url} target="_blank" rel="noreferrer">
							Open LeetCode profile
						</a>
					</article>
				</div>
			</div>
		</section>
	);
};

export default AboutSection;
