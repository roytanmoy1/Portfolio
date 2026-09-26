"use client";

import { useEffect, useMemo, useState } from "react";
import { FaGithub, FaExternalLinkAlt, FaCode, FaChartLine } from "react-icons/fa";
import styles from "./Sections.module.css";
import SortableGrid from "./SortableGrid";
import { portfolioData } from "../data/portfolioData";

const githubApiUrl = "https://api.github.com/users/roytanmoy1/repos?per_page=100&sort=updated";
const personalProjects = portfolioData.personalProjects.map((project) => ({
	...project,
	id: project.repo,
	label: project.title,
}));

const normalizeExternalUrl = (value) => {
	if (typeof value !== "string" || !value.trim()) return "";

	try {
		const candidate = value.startsWith("http") ? value : `https://${value}`;
		const url = new URL(candidate);
		return url.protocol === "https:" ? url.href : "";
	} catch {
		return "";
	}
};

const isOwnedGithubUrl = (value) => {
	try {
		const url = new URL(value);
		return url.protocol === "https:" && url.hostname === "github.com" && url.pathname.startsWith("/roytanmoy1/");
	} catch {
		return false;
	}
};

const LabSection = ({ id }) => {
	const [repositories, setRepositories] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showAll, setShowAll] = useState(false);

	useEffect(() => {
		const controller = new AbortController();

		const loadRepositories = async () => {
			try {
				const response = await fetch(githubApiUrl, {
					headers: { Accept: "application/vnd.github+json" },
					signal: controller.signal,
				});

				if (!response.ok) throw new Error("GitHub repositories are temporarily unavailable.");

				const payload = await response.json();
				if (!Array.isArray(payload)) throw new Error("GitHub returned an unexpected response.");

				const safeRepositories = payload
					.filter((repository) => !repository.fork && isOwnedGithubUrl(repository.html_url))
					.map((repository) => ({
						name: typeof repository.name === "string" ? repository.name : "Repository",
						description: typeof repository.description === "string" && repository.description.trim()
							? repository.description
							: "Public repository from the GitHub project archive.",
						language: typeof repository.language === "string" ? repository.language : "Project",
						repoUrl: repository.html_url,
						liveUrl: normalizeExternalUrl(repository.homepage),
					}))
					.sort((first, second) => first.name.localeCompare(second.name));

				setRepositories(safeRepositories);
			} catch (loadError) {
				if (loadError.name !== "AbortError") setError(loadError.message);
			} finally {
				if (!controller.signal.aborted) setLoading(false);
			}
		};

		loadRepositories();
		return () => controller.abort();
	}, []);

	const featuredNames = useMemo(
		() => new Set(portfolioData.personalProjects.map((project) => project.repo)),
		[]
	);
	const repositoryShelf = repositories.filter((repository) => !featuredNames.has(repository.name));
	const visibleRepositories = showAll ? repositoryShelf : repositoryShelf.slice(0, 8);

	return (
		<section id={id} className={styles.section}>
			<div className={styles.sectionInner}>
				<div className={styles.sectionHeading}>
					<p className={styles.sectionEyebrow}>Personal lab</p>
					<h2 className={styles.sectionTitle}>The work I build when curiosity gets loud.</h2>
					<p className={styles.sectionLead}>
						A clearer home for side projects, experiments, and problem-solving practice.
						Each project has a repository link, and deployed work gets a live preview slot.
					</p>
				</div>

				<div className={styles.labGrid}>
					<article className={styles.leetcodeCard}>
						<div className={styles.labCardHeader}>
							<span className={styles.labIcon} aria-hidden="true"><FaChartLine /></span>
							<div>
								<p className={styles.educationLabel}>Problem solving</p>
								<h3 className={styles.educationTitle}>LeetCode · {portfolioData.leetcode.username}</h3>
							</div>
						</div>

						<div className={styles.leetcodeStats}>
							<div><strong>{portfolioData.leetcode.solved}</strong><span>solved</span></div>
							<div><strong>{portfolioData.leetcode.acceptance}</strong><span>acceptance</span></div>
							<div><strong>{portfolioData.leetcode.rank}</strong><span>global rank</span></div>
						</div>

						<div className={styles.leetcodeMeta}>
							<span>{portfolioData.leetcode.activeDays} active days</span>
							<span>{portfolioData.leetcode.maxStreak} day max streak</span>
						</div>
						<div className={styles.stackList} aria-label="LeetCode languages and focus areas">
							{[...portfolioData.leetcode.languages, ...portfolioData.leetcode.focus].map((item) => (
								<span className={styles.stackTag} key={item}>{item}</span>
							))}
						</div>
						<a className={styles.projectLink} href={portfolioData.leetcode.url} target="_blank" rel="noreferrer">
							Open LeetCode profile
						</a>
					</article>

					<div className={styles.personalProjects}>
						<div className={styles.labSubheading}>
							<div>
								<p className={styles.educationLabel}>Curated projects</p>
								<h3 className={styles.educationTitle}>Personal builds and experiments</h3>
							</div>
							<a className={styles.projectLink} href={portfolioData.github} target="_blank" rel="noreferrer">
								All GitHub repos
							</a>
						</div>

						<SortableGrid
							items={personalProjects}
							className={styles.personalProjectGrid}
							storageKey="portfolio-project-order"
							renderItem={(project) => (
								<article className={styles.personalProjectCard}>
									<div className={styles.projectPreview}>
										{project.liveUrl ? (
											<div className={styles.previewPlaceholder}>
												<FaExternalLinkAlt aria-hidden="true" />
												<span>Live app available</span>
												<a className={styles.previewLink} href={project.liveUrl} target="_blank" rel="noreferrer">
													Open preview
												</a>
											</div>
										) : (
											<div className={styles.previewPlaceholder}>
												<FaCode aria-hidden="true" />
												<span>Deployment slot open</span>
											</div>
										)}
									</div>
									<p className={styles.projectCategory}>{project.category}</p>
									<h4 className={styles.projectTitle}>{project.title}</h4>
									<p className={styles.projectDescription}>{project.description}</p>
									<div className={styles.stackList} aria-label={`${project.title} technology stack`}>
										{project.stack.map((technology) => (
											<span className={styles.stackTag} key={technology}>{technology}</span>
										))}
									</div>
									<div className={styles.repoActions}>
										<a className={styles.repoLink} href={project.repoUrl} target="_blank" rel="noreferrer">
											<FaGithub aria-hidden="true" /> Repository
										</a>
										{project.liveUrl ? (
											<a className={styles.repoLink} href={project.liveUrl} target="_blank" rel="noreferrer">
												<FaExternalLinkAlt aria-hidden="true" /> Open app
											</a>
										) : (
											<span className={styles.repoStatus}>Not deployed yet</span>
										)}
									</div>
								</article>
							)}
						/>
					</div>
				</div>

				<div className={styles.repositoryShelf}>
					<div className={styles.labSubheading}>
						<div>
							<p className={styles.educationLabel}>Public archive</p>
							<h3 className={styles.educationTitle}>More repositories from GitHub</h3>
						</div>
						{repositoryShelf.length > 8 && (
							<button className={styles.filterButton} type="button" onClick={() => setShowAll((current) => !current)}>
								{showAll ? "Show fewer" : `Show all ${repositoryShelf.length}`}
							</button>
						)}
					</div>

					{loading && <p className={styles.repoMessage} role="status">Loading public repositories…</p>}
					{error && (
						<p className={styles.repoMessage} role="status">
							{error} <a href={portfolioData.github} target="_blank" rel="noreferrer">Browse GitHub directly.</a>
						</p>
					)}
					{!loading && !error && (
						<div className={styles.repoGrid}>
							{visibleRepositories.map((repository) => (
								<article className={styles.repoCard} key={repository.repoUrl}>
									<div className={styles.repoCardTop}>
										<FaGithub aria-hidden="true" />
										<span>{repository.language}</span>
									</div>
									<h4>{repository.name}</h4>
									<p>{repository.description}</p>
									<div className={styles.repoActions}>
										<a className={styles.repoLink} href={repository.repoUrl} target="_blank" rel="noreferrer">Repository</a>
										{repository.liveUrl && <a className={styles.repoLink} href={repository.liveUrl} target="_blank" rel="noreferrer">Live URL</a>}
									</div>
								</article>
							))}
						</div>
					)}
				</div>
			</div>
		</section>
	);
};

export default LabSection;
