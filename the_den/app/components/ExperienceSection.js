import Image from "next/image";
import styles from "./Sections.module.css";
import { portfolioData } from "../data/portfolioData";

const ExperienceSection = ({ id }) => {
	return (
		<section id={id} className={styles.section}>
			<div className={styles.sectionInner}>
				<div className={styles.sectionHeading}>
					<p className={styles.sectionEyebrow}>Where I&apos;ve made impact</p>
					<h2 className={styles.sectionTitle}>Experience that compounds.</h2>
					<p className={styles.sectionLead}>
						From enterprise analytics to Generative AI platforms, I&apos;ve worked across
						architecture, delivery, and the details that make products reliable.
					</p>
				</div>

				<div className={styles.experienceTimeline}>
					<div className={styles.timelineLine} aria-hidden="true" />
					{portfolioData.experience.map((experience) => (
						<article className={styles.experienceCard} key={`${experience.company}-${experience.role}`}>
							<div className={styles.experienceMark} aria-hidden="true">
								{experience.logo ? (
									<Image
										src={experience.logo}
										alt=""
										width={24}
										height={24}
										className={styles.experienceLogo}
									/>
								) : (
									experience.mark
								)}
							</div>

							<div className={styles.experienceTop}>
								<div className={styles.experienceIdentity}>
									<h3 className={styles.experienceRole}>{experience.role}</h3>
									<p className={styles.company}>{experience.company} · {experience.location}</p>
								</div>
								<div className={styles.experienceDate}>
									{experience.dates}
									{experience.current && (
										<span className={styles.currentBadge}>
											<span className={styles.statusDot} aria-hidden="true" />
											Current
										</span>
									)}
								</div>
							</div>

							<p className={styles.experienceSummary}>{experience.summary}</p>

							<div className={styles.stackList} aria-label={`${experience.company} technology stack`}>
								{experience.stack.map((technology) => (
									<span className={styles.stackTag} key={technology}>{technology}</span>
								))}
							</div>

							<ul className={styles.experienceHighlights}>
								{experience.highlights.map((highlight) => (
									<li key={highlight}>{highlight}</li>
								))}
							</ul>
						</article>
					))}
				</div>
			</div>
		</section>
	);
};

export default ExperienceSection;
