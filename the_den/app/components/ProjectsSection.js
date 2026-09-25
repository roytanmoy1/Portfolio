"use client";

import { useMemo, useState } from "react";
import styles from "./Sections.module.css";
import { portfolioData } from "../data/portfolioData";

const ProjectsSection = ({ id }) => {
	const [activeFilter, setActiveFilter] = useState("All");
	const filters = ["All", ...new Set(portfolioData.projects.map((project) => project.category))];
	const visibleProjects = useMemo(
		() => activeFilter === "All"
			? portfolioData.projects
			: portfolioData.projects.filter((project) => project.category === activeFilter),
		[activeFilter]
	);

	return (
		<section id={id} className={styles.section}>
			<div className={styles.sectionInner}>
				<div className={styles.sectionHeading}>
					<p className={styles.sectionEyebrow}>Enterprise case studies</p>
					<h2 className={styles.sectionTitle}>Systems behind ambitious products.</h2>
					<p className={styles.sectionLead}>
						Selected delivery work from Deloitte USI, Tiger Analytics, and Accenture.
						Personal builds, experiments, and algorithm practice live in the Lab.
					</p>
				</div>

				<div className={styles.projectsToolbar}>
					<div className={styles.filterList} role="group" aria-label="Filter projects">
						{filters.map((filter) => (
							<button
								type="button"
								key={filter}
								className={`${styles.filterButton} ${activeFilter === filter ? styles.active : ""}`}
								onClick={() => setActiveFilter(filter)}
								aria-pressed={activeFilter === filter}
							>
								{filter}
							</button>
						))}
					</div>
					<span className={styles.projectCount}>{visibleProjects.length} case studies</span>
				</div>

				<div className={styles.projectsGrid}>
					{visibleProjects.map((project) => (
						<article className={styles.projectCard} key={project.title}>
							<div className={styles.projectTop}>
								<span className={styles.projectCategory}>{project.category}</span>
								<span className={styles.projectMetric}>{project.metric}</span>
							</div>
							<h3 className={styles.projectTitle}>{project.title}</h3>
							<p className={styles.projectClient}>{project.client} · {project.period}</p>
							<p className={styles.projectDescription}>{project.description}</p>

							<div className={styles.stackList} aria-label={`${project.title} technology stack`}>
								{project.stack.map((technology) => (
									<span className={styles.stackTag} key={technology}>{technology}</span>
								))}
							</div>

							<ul className={styles.projectHighlights}>
								{project.highlights.map((highlight) => (
									<li className={styles.projectHighlight} key={highlight}>{highlight}</li>
								))}
							</ul>

							<div className={styles.projectLinks}>
								<a className={styles.projectLink} href="#contact">Discuss a similar build</a>
							</div>
						</article>
					))}
				</div>
			</div>
		</section>
	);
};

export default ProjectsSection;
