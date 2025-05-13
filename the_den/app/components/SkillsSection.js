import styles from "./Sections.module.css";

const SkillsSection = ({ id }) => {
	const skills = {
		frontend: ["React.js", "Vue.js", "Next.js", "JavaScript", "HTML/CSS"],
		backend: ["Node.js", "Next.js", "MongoDB", "MySQL", "PostgreSQL", "Sequelize","Express.js"],
		cloud: [
			"Azure (App Services, Functions, Blob Storage)",
			"AWS (S3, Stepfunctions, Lambda)",
			"AWS (CodePipeline, CodeDeploy)",
			"AWS (Cloudwatch, SNS, SES)",
			"Azure (TFS)",
		],
		tools: ["Git", "GitHub", "VS Code", "Postman"],
		unitTesting: ["Jest.js", "DBFit"],
		general: ["Debugging", "Problem solving", "Teamwork", "Communication"],
	};
	return (
		<section id={id} className={styles.section}>
			<div className={styles.content}>
				<h2>My Skills</h2>
				<div className={styles.skillsContainer}>
					{Object.entries(skills).map(([category, skillList]) => (
						<div key={category} className={styles.skillCategory}>
							<h3 className={styles.categoryTitle}>
								{category.charAt(0).toUpperCase() + category.slice(1)}
							</h3>
							<div className={styles.skillTags}>
								{skillList.map((skill, index) => (
									<div key={index} className={styles.skillTag}>
										{skill}
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default SkillsSection;
