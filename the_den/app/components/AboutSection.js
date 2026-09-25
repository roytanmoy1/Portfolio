import styles from "./Sections.module.css";
import { portfolioData } from "../data/portfolioData";

const AboutSection = ({ id }) => {
	return (
		<section id={id} className={styles.section}>
			<div className={styles.sectionInner}>
				<div className={styles.sectionHeading}>
					<p className={styles.sectionEyebrow}>The short version</p>
					<h2 className={styles.sectionTitle}>A builder who likes the hard parts.</h2>
				</div>

				<div className={styles.aboutGrid}>
					<div className={styles.aboutIntro}>
						<p>
							I&apos;m a <strong>full stack engineer</strong> based in Bengaluru, focused on
							making complex products feel simple. My work sits at the intersection of
							<strong> modern JavaScript, cloud architecture, real-time systems, and AI</strong>.
						</p>
						<span className={styles.introQuote}>
							&ldquo;Good engineering is invisible when it works beautifully.&rdquo;
						</span>
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
				</div>
			</div>
		</section>
	);
};

export default AboutSection;
