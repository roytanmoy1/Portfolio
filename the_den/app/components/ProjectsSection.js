import styles from "./Sections.module.css";

const ProjectsSection = ({id}) => {
	const projects = [
		{
			title: "Invoice Dashboard using Next.js",
			description:
				"A dashboard for managing invoices, payments and customer details",
			technologies: [
				"Next.js",
				"React.js",
				"HTML5/CSS3",
				"PostGRESQL",
				"Github",
				"Vercel",
			],
			source: "Developed as part of learning NextJS from nextjs.org",
			links: [
				{
					title: "Live Demo",
					url: "https://next-js-app-nine-ebon.vercel.app/login?callbackUrl=https%3A%2F%2Fnext-js-app-nine-ebon.vercel.app%2Fdashboard",
					type: "demo",
				},
				{
					title: "Source Code",
					url: "https://github.com/roytanmoy1/NextJSApp",
					type: "code",
				},
			],
		},
	];

	return (
		<section id={id} className={styles.section}>
			<div className={styles.content}>
				<h2>My Projects</h2>
				<div className={styles.projectsGrid}>
					{projects.map((project, index) => (
						<div key={index} className={styles.projectCard}>
							<h3>{project.title}</h3>
							<p>{project.description}</p>
							<div className={styles.techStack}>
								{project.technologies.map((tech, techIndex) => (
									<span key={techIndex} className={styles.techTag}>
										{tech}
									</span>
								))}
							</div>
							<p className={styles.projectSource}>{project.source}</p>
							<div className={styles.projectLinks}>
								{project.links.map((link, linkIndex) => (
									<a
										key={linkIndex}
										href={link.url}
										target="_blank"
										rel="noopener noreferrer"
										className={`${styles.projectLink} ${styles[link.type]}`}
									>
										{link.title}
									</a>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default ProjectsSection;
