"use client";
import React from "react";
import styles from "./Sections.module.css";
import Image from "next/image";

const ExperienceSection = ({ id }) => {
	// Array of experience data
	const experiences = [
		{
    role: "Lead- App Engineering",
    company: "Tiger Analytics, India",
    year: "Feb 2025 - Current",
    companyLogo: "/TALOGO.jpeg",
    skills:
        "ReactJS, NodeJS, ExpressJS, Azure App Services, MySQL, HTML, SCSS, Sequelize, Websockets, Power BI, MicroStrategy, Keycloak",
    responsibilities: [
        "Led the end-to-end development of DeepThought, a proprietary B2B AI platform built from scratch to support enterprise-scale use cases and LLM-powered chat workflows.",
        "Delivered two full MVPs within three months, enabling rapid client onboarding and internal demo cycles.",
        "Architected and developed full-stack infrastructure using React and Node.js, with seamless integration of real-time features via WebSockets.",
        "Built advanced file viewing, uploading, and editing modules, enabling users to interact with files and send them directly to the integrated LLM chat interface.",
        "Integrated dashboards from Power BI and MicroStrategy, creating unified analytics views for business users.",
        "Implemented secure authentication and role-based access using Keycloak, ensuring compliance and controlled access.",
        "Developed and maintained a reusable UI component library, boosting front-end scalability and development speed.",
        "Collaborated closely with product owners and cross-functional teams to align technical features with evolving business needs and client demands.",
        "Integrated external Python-based services for analytics and machine learning, supporting intelligent decision-making across workflows.",
        {
            title: "Orchestration of deployments across multiple environments",
            subItems: [
                "Development and Testing",
                "UAT/Performance Testing",
                "Production release management",
            ],
        },
    ],
    summary:
        "Key focus on delivering high-quality, scalable solutions while adhering to best practices and maintaining code quality standards throughout the development lifecycle.",
},
		{
			role: "Full Stack Developer (3.9 YOE)",
			company: "Accenture, India",
			year: "May 2021 to Feb 2025",
			companyLogo: "/Accenture-Emblem.png",
			skills:
				"VueJS, ReactJS, NodeJS, ExpressJS, AWS, MySQL, HTML, CSS, JestJS, DBFit",
			responsibilities: [
				"Requirements analysis and effort estimation",
				"Development of responsive UI components using modern JavaScript frameworks",
				"Implementation of RESTful API endpoints with robust authentication and authorization",
				"Database optimization through efficient queries and stored procedures",
				"Integration of AWS services for data management and storage solutions",
				"Creation of maintainable and scalable CSS architectures",
				"Comprehensive testing using JestJS and DBFit frameworks",
				{
					title: "Orchestration of deployments across multiple environments",
					subItems: [
						"Development and Testing",
						"UAT/Performance Testing",
						"Production release management",
					],
				},
			],
			summary:
				"Key focus on delivering high-quality, scalable solutions while adhering to best practices and maintaining code quality standards throughout the development lifecycle.",
		},
		{
			role: "Software Engineer Intern (2 Months)",
			company: "Highradius, India",
			year: "Apr 2020 to June 2020",
			companyLogo: "/Highradius-Emblem.png",
			skills: "JavaScript, React, Node.js, MongoDB",
			responsibilities: [
				"Developed and maintained web applications using React.js",
				"Collaborated with senior developers on feature implementation",
				"Participated in code reviews and testing procedures",
				"Assisted in database design and optimization",
			],
			summary:
				"Worked on creation of Chatbot based dashboard using ReactJS and NodeJS to assist user in handling invoices and payments for fintech platform.",
		},
	];

	return (
		<section id={id} className={styles.section}>
			<div className={styles.content}>
				<h2>Experience</h2>
				{experiences.map((exp, index) => (
					<div key={index} className={styles.experienceBox}>
						<div className={styles.experienceHeader}>
							<Image
								src={exp.companyLogo}
								alt={`${exp.company} Logo`}
								width={32}
								height={32}
								className={styles.companyIcon}
							/>
							<div>
								<h3>{exp.role}</h3>
								<p className={styles.company}>
									{exp.company} - {exp.year}
								</p>
							</div>
						</div>

						<div className={styles.skillsSection}>
							<p className={styles.skillsLabel}>Tech Stack Used:</p>
							<p className={styles.skillsList}>{exp.skills}</p>
						</div>

						{exp.responsibilities && (
							<>
								<p>
									Led end-to-end feature development lifecycle encompassing:
								</p>
								<ul>
									{exp.responsibilities.map((resp, respIndex) =>
										typeof resp === "string" ? (
											<li key={respIndex}>{resp}</li>
										) : (
											<li key={respIndex}>
												{resp.title}
												{resp.subItems && (
													<ul className={styles.subList}>
														{resp.subItems.map((subItem, subIndex) => (
															<li key={subIndex}>{subItem}</li>
														))}
													</ul>
												)}
											</li>
										)
									)}
								</ul>
							</>
						)}

						<p>{exp.summary}</p>
					</div>
				))}
			</div>
		</section>
	);
};

export default ExperienceSection;
