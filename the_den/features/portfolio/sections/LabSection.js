"use client";

import { useEffect, useMemo, useState } from "react";
import { FaGithub, FaExternalLinkAlt, FaCode } from "react-icons/fa";
import styles from "./Sections.module.css";
import SortableGrid from "@/shared/components/SortableGrid";
import { usePortfolioSectionData } from "../hooks/usePortfolioSectionData";
import PortfolioSectionFeedback from "../components/PortfolioSectionFeedback";

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

const getGithubOwner = (value) => {
	try {
		const url = new URL(value);
		const segments = url.pathname.split("/").filter(Boolean);
		return url.protocol === "https:" && url.hostname === "github.com" && segments.length === 1
			? segments[0]
			: "";
	} catch {
		return "";
	}
};

const isOwnedGithubUrl = (value, owner) => {
	try {
		const url = new URL(value);
		const [repositoryOwner, repository] = url.pathname.split("/").filter(Boolean);
		return url.protocol === "https:"
			&& url.hostname === "github.com"
			&& repositoryOwner?.toLowerCase() === owner.toLowerCase()
			&& Boolean(repository);
	} catch {
		return false;
	}
};

const LabSection = ({ id }) => {
	const { sectionRef, data: labData, error: portfolioError, retry: retryPortfolio } = usePortfolioSectionData("lab");
	const [repositories, setRepositories] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showAll, setShowAll] = useState(false);
	const personalProjects = (labData?.personalProjects ?? []).map((project) => ({
		...project,
		id: project.repo,
		label: project.title,
	}));

	useEffect(() => {
		const owner = getGithubOwner(labData?.github);
		const section = sectionRef.current;
		if (!section || !owner) return undefined;

		const controller = new AbortController();

		const loadRepositories = async () => {
			try {
				const response = await fetch(`https://api.github.com/users/${encodeURIComponent(owner)}/repos?per_page=100&sort=updated`, {
					headers: { Accept: "application/vnd.github+json" },
					signal: controller.signal,
				});

				if (!response.ok) throw new Error("GitHub repositories are temporarily unavailable.");

				const payload = await response.json();
				if (!Array.isArray(payload)) throw new Error("GitHub returned an unexpected response.");

				const safeRepositories = payload
					.filter((repository) => !repository.fork && isOwnedGithubUrl(repository.html_url, owner))
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

		if (typeof window.IntersectionObserver !== "function") {
			void loadRepositories();
			return () => controller.abort();
		}

		const observer = new IntersectionObserver((entries) => {
			if (!entries.some((entry) => entry.isIntersecting)) return;
			observer.disconnect();
			void loadRepositories();
		}, { rootMargin: "480px 0px" });
		observer.observe(section);

		return () => {
			observer.disconnect();
			controller.abort();
		};
	}, [labData?.github, sectionRef]);

	const featuredNames = useMemo(
		() => new Set(labData?.personalProjects.map((project) => project.repo) ?? []),
		[labData]
	);
	const repositoryShelf = labData ? repositories.filter((repository) => !featuredNames.has(repository.name)) : [];
	const visibleRepositories = showAll ? repositoryShelf : repositoryShelf.slice(0, 8);

	return (
		<section id={id} ref={sectionRef} className={styles.section}>
			<div className={styles.sectionInner}>
				<div className={styles.sectionHeading}>
					<p className={styles.sectionEyebrow}>Personal lab</p>
					<h2 className={styles.sectionTitle}>Personal projects and practice.</h2>
				</div>

				<div className={styles.personalProjects}>
					<div className={styles.labSubheading}>
						<div>
							<p className={styles.educationLabel}>Curated projects</p>
							<h3 className={styles.educationTitle}>Personal builds and experiments</h3>
						</div>
						{labData?.github && (
							<a className={styles.projectLink} href={labData.github} target="_blank" rel="noreferrer">
								All GitHub repos
							</a>
						)}
					</div>

					{!labData ? (
						<PortfolioSectionFeedback
							label="personal projects"
							error={portfolioError}
							onRetry={retryPortfolio}
							className={styles.repoMessage}
							retryClassName={styles.filterButton}
						/>
					) : (
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
					)}
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
							{error} {labData?.github && <a href={labData.github} target="_blank" rel="noreferrer">Browse GitHub directly.</a>}
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
