"use client";

import styles from "./Sections.module.css";
import SortableGrid from "./SortableGrid";
import { portfolioData } from "../data/portfolioData";

const skillGroups = portfolioData.skills.map((group) => ({
	...group,
	id: group.category,
	label: group.category,
}));

const SkillsSection = ({ id }) => {
	return (
		<section id={id} className={styles.section}>
			<div className={styles.sectionInner}>
				<div className={styles.sectionHeading}>
					<p className={styles.sectionEyebrow}>Tools of the trade</p>
					<h2 className={styles.sectionTitle}>A versatile engineering toolkit.</h2>
					<p className={styles.sectionLead}>
						The stack changes with the problem. The standards do not: clear interfaces,
						observable systems, secure defaults, and thoughtful UX.
					</p>
				</div>

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
			</div>
		</section>
	);
};

export default SkillsSection;
