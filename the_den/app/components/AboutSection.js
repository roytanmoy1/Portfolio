import styles from "./Sections.module.css";

const calculateYears = () => {
	const startDate = new Date("2021-05-28");
	const currentDate = new Date();

	// Calculate total months difference
	const yearDiff = currentDate.getFullYear() - startDate.getFullYear();
	const monthDiff = currentDate.getMonth() - startDate.getMonth();

	// Total months
	let totalMonths = yearDiff * 12 + monthDiff;

	return Number((totalMonths / 12).toFixed(1));
};

const AboutSection = ({ id }) => {
	const expYears = calculateYears();
	const myData = {
		about: (
			<>
				A <strong>full stack developer</strong> based in Bangalore, India,
				specializing in JavaScript and its ecosystem of modern frameworks and
				libraries
			</>
		),
		yoe: (
			<>
				Over <strong>{expYears}+ years</strong> of industry experience in
				developing and maintaining scalable web applications using JavaScript
				and related technologies
			</>
		),
		techStack: (
			<>
				Extensive experience with modern technologies including{" "}
				<strong>React, Vue.js, Node.js, Express, MongoDB, MySQL</strong>, and{" "}
				<strong>AWS</strong> services for building robust full-stack
				applications
			</>
		),
		css: (
			<>
				Strong expertise in modern CSS frameworks and methodologies including{" "}
				<strong>Tailwind CSS</strong>, SCSS, and responsive design principles
				for creating intuitive user interfaces
			</>
		),
		restAPI: (
			<>
				Comprehensive understanding of <strong>RESTful API</strong> design
				principles and implementation, with experience in building scalable and
				maintainable API architectures
			</>
		),
		aws: (
			<>
				Proficient in AWS cloud services including{" "}
				<strong>S3, Lambda, Step Functions, SNS, SES, CloudWatch</strong>, along
				with expertise in implementing robust CI/CD pipelines using AWS DevOps
				tools for automated deployment
			</>
		),
		performance: (
			<>
				Proven track record in optimizing application performance through
				efficient database query optimization and leveraging{" "}
				<strong>AWS cloud services</strong> for enhanced data handling and
				storage operations
			</>
		),
		auth: (
			<>
				Implemented comprehensive security solutions using{" "}
				<strong>JWT, OAuth</strong>, and role-based access control (RBAC),
				ensuring secure user authentication and authorization across
				applications
			</>
		),
		learning: (
			<>
				Passionate about continuous learning and professional development,
				actively staying updated with emerging technologies and industry best
				practices to implement innovative solutions
			</>
		),
		ds: (
			<>
				Strong foundation in data structures and algorithms, demonstrated
				through problem-solving on platforms like <strong>LeetCode</strong> and
				<strong> HackerRank</strong>, with a focus on writing efficient and
				optimized code
			</>
		),
	};

	return (
		<section id={id} className={styles.section}>
			<h2>About Me</h2>
			<div className={styles.content}>
				<ul>
					<li>{myData.about}</li>
					<li>{myData.yoe}</li>
					<li>{myData.techStack}</li>
					<li>{myData.css}</li>
					<li>{myData.restAPI}</li>
					<li>{myData.aws}</li>
					<li>{myData.performance}</li>
					<li>{myData.auth}</li>
					<li>{myData.learning}</li>
					<li>{myData.ds}</li>
				</ul>
			</div>
		</section>
	);
};

export default AboutSection;
