import styles from "./Sections.module.css";
import { portfolioData } from "../data/portfolioData";

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

				<div className={styles.skillsContainer}>
					{portfolioData.skills.map((group) => (
						<section className={styles.skillCategory} key={group.category}>
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
					))}
				</div>
			</div>
		</section>
	);
};

export default SkillsSection;
