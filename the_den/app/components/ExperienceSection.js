import Image from "next/image";
import styles from "./Sections.module.css";
import { portfolioData } from "../data/portfolioData";

const projectsByCompany = portfolioData.projects.reduce((groups, project) => {
	(groups[project.client] ??= []).push(project);
	return groups;
}, {});

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

							{projectsByCompany[experience.company]?.length > 0 && (
								<div className={styles.companyProjects}>
									<p className={styles.companyProjectsLabel}>Selected projects</p>
									<div className={styles.companyProjectList}>
										{projectsByCompany[experience.company].map((project, projectIndex) => (
											<details className={styles.companyProject} key={project.title}>
												<summary>
													<span className={styles.projectOrder}>{String(projectIndex + 1).padStart(2, "0")}</span>
													<span className={styles.companyProjectIdentity}>
														<strong>{project.title}</strong>
														<small>{project.category} · {project.period}</small>
													</span>
												</summary>
												<div className={styles.companyProjectBody}>
													<p>{project.description}</p>
													<ul>
														{project.highlights.slice(0, 3).map((highlight) => (
															<li key={highlight}>{highlight}</li>
														))}
													</ul>
												</div>
											</details>
										))}
									</div>
								</div>
							)}
						</article>
					))}
				</div>
			</div>
		</section>
	);
};

export default ExperienceSection;
