import styles from "./Sections.module.css";
import { usePortfolioSectionData } from "../hooks/usePortfolioSectionData";
import PortfolioSectionFeedback from "../components/PortfolioSectionFeedback";

const AboutSection = ({ id }) => {
	const { sectionRef, data, error, retry } = usePortfolioSectionData("about");

	return (
		<section id={id} ref={sectionRef} className={styles.section}>
			<div className={styles.sectionInner}>
				<div className={styles.sectionHeading}>
					<p className={styles.sectionEyebrow}>Profile</p>
					<h2 className={styles.sectionTitle}>From product goals to dependable software.</h2>
				</div>

				{!data ? (
					<PortfolioSectionFeedback
						label="profile"
						error={error}
						onRetry={retry}
						className={styles.sectionLead}
						retryClassName={styles.filterButton}
					/>
				) : (
					<>
						<div className={styles.aboutPoints}>
							{data.aboutPoints.map((point, index) => (
						<article className={styles.aboutPoint} key={point.label}>
							<span className={styles.pointNumber}>{String(index + 1).padStart(2, "0")}</span>
							<div className={styles.pointContent}>
								<strong className={styles.pointLabel}>{point.label}</strong>
								<p>{point.text}</p>
							</div>
						</article>
							))}
						</div>

						<div className={styles.educationGrid}>
					<article className={styles.educationCard}>
						<p className={styles.educationLabel}>Education</p>
						<h3 className={styles.educationTitle}>{data.education.degree}</h3>
						<p className={styles.educationText}>
							{data.education.institution} · {data.education.years}<br />
							{data.education.discipline} · {data.education.result}
						</p>
					</article>
					<article className={styles.educationCard}>
						<p className={styles.educationLabel}>Certifications</p>
						<div className={styles.certificationList}>
							{data.certifications.map((certification) => (
								<span className={styles.certification} key={certification}>{certification}</span>
							))}
						</div>
					</article>
				</div>
					</>
				)}
			</div>
		</section>
	);
};

export default AboutSection;
