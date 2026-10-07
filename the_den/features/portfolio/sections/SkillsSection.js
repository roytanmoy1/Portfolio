"use client";

import styles from "./Sections.module.css";
import SortableGrid from "@/shared/components/SortableGrid";
import { usePortfolioSectionData } from "../hooks/usePortfolioSectionData";
import PortfolioSectionFeedback from "../components/PortfolioSectionFeedback";

const SkillsSection = ({ id }) => {
	const { sectionRef, data, error, retry } = usePortfolioSectionData("skills");
	const skillGroups = (data ?? []).map((group) => ({ ...group, id: group.category, label: group.category }));

	return (
		<section id={id} ref={sectionRef} className={styles.section}>
			<div className={styles.sectionInner}>
				<div className={styles.sectionHeading}>
					<p className={styles.sectionEyebrow}>Technical skills</p>
					<h2 className={styles.sectionTitle}>Core technologies.</h2>
				</div>

				{!data ? (
					<PortfolioSectionFeedback
						label="skills"
						error={error}
						onRetry={retry}
						className={styles.sectionLead}
						retryClassName={styles.filterButton}
					/>
				) : (
					<SortableGrid
						items={skillGroups}
						className={styles.skillsContainer}
						storageKey="portfolio-skill-order"
						renderItem={(group) => (
							<section className={styles.skillCategory}>
								<div className={styles.skillCategoryHeader}>
									<span className={styles.skillCategoryIcon} aria-hidden="true">{group.icon}</span>
									<h3 className={styles.categoryTitle}>{group.category}</h3>
								</div>
								<div className={styles.skillTags}>
									{group.items.map((skill) => (
										<div className={styles.skillTag} key={skill.name}>
											<span>{skill.name}</span>
											<span className={styles.skillLevel} aria-hidden="true">
												<span className={styles.skillLevelFill} style={{ width: `${skill.level}%` }} />
											</span>
										</div>
									))}
								</div>
							</section>
						)}
					/>
				)}
			</div>
		</section>
	);
};

export default SkillsSection;
