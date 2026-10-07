import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";

const parseEnvFile = async (fileName) => {
	const file = await readFile(new URL(`../${fileName}`, import.meta.url), "utf8");
	return Object.fromEntries(file.split(/\r?\n/).flatMap((line) => {
		const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
		if (!match || match[1].startsWith("#")) return [];
		let value = match[2].trim();
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1);
		}
		return [[match[1], value]];
	}));
};

const sourceEnv = await parseEnvFile(".env.neon.portfolio.local");
const selfCheck = process.argv.includes("--self-check");
const targetEnv = selfCheck ? sourceEnv : await parseEnvFile(".env.neon.local");
const sourceUrl = sourceEnv.DATABASE_URL_UNPOOLED;
const targetUrl = targetEnv.DATABASE_URL_UNPOOLED;
const sourceBranch = sourceEnv.NEON_BRANCH;
const targetBranch = targetEnv.NEON_BRANCH;
const applyChanges = process.argv.includes("--apply");

if (selfCheck && applyChanges) throw new Error("Self-check mode cannot apply changes.");
if (!sourceUrl || !targetUrl) throw new Error("Source and target database URLs are required.");
if (!sourceBranch || !targetBranch) throw new Error("Source and target Neon branch names are required.");
if (sourceBranch === "production") throw new Error("Production cannot be the portfolio data source.");
if (applyChanges && (targetBranch !== "production" || !process.argv.includes("--confirm-production"))) {
	throw new Error("Applying production data requires the explicit production confirmation.");
}
if (!applyChanges && sourceBranch !== targetBranch && targetBranch !== "production") {
	throw new Error("Dry-run targets must be the source branch or production.");
}

for (const url of [sourceUrl, targetUrl]) {
	if (new URL(url).hostname.includes("-pooler")) {
		throw new Error("Portfolio promotion requires direct, non-pooled database URLs.");
	}
}
if (applyChanges && new URL(sourceUrl).hostname === new URL(targetUrl).hostname) {
	throw new Error("Source and target must be different Neon branch endpoints.");
}

const insertRows = async (client, table, columns, rows) => {
	if (!rows.length) return;
	const values = [];
	const placeholders = rows.map((row) => `(${row.map((value) => {
		values.push(value);
		return `$${values.length}`;
	}).join(", ")})`);
	await client.query(
		`INSERT INTO ${table} (${columns.join(", ")}) VALUES ${placeholders.join(", ")}`,
		values
	);
};

const sourcePool = new Pool({ connectionString: sourceUrl, max: 1 });
const targetPool = new Pool({ connectionString: targetUrl, max: 1 });
const targetClient = await targetPool.connect();

try {
	console.log("Loading source portfolio rows.");
	const [profileResult, leetcodeResult, highlightResult, aboutResult, skillGroupResult, skillItemResult,
		experienceResult, experienceStackResult, experienceHighlightResult, projectResult, projectStackResult,
		projectHighlightResult, personalProjectResult, personalStackResult, educationResult, certificationResult] = await Promise.all([
		sourcePool.query(`SELECT name, short_name AS "shortName", assistant_name AS "assistantName", title, location, email, phones,
			linkedin_url AS linkedin, github_url AS github, resume_url AS resume, photo_url AS photo, profile_summary AS profile
			FROM portfolio_profile WHERE profile_id = 1`),
		sourcePool.query(`SELECT url, username, global_rank, solved, acceptance, active_days, max_streak, languages, focus
			FROM portfolio_leetcode WHERE profile_id = 1`),
		sourcePool.query("SELECT value, label FROM portfolio_highlights ORDER BY sort_order"),
		sourcePool.query("SELECT label, content AS text FROM portfolio_about_points ORDER BY sort_order"),
		sourcePool.query("SELECT id, category, icon FROM portfolio_skill_groups ORDER BY sort_order"),
		sourcePool.query("SELECT group_id, name, level FROM portfolio_skill_items ORDER BY group_id, sort_order"),
		sourcePool.query(`SELECT id, company, role, dates, location, mark, logo, is_current AS current, summary
			FROM portfolio_experience ORDER BY sort_order`),
		sourcePool.query("SELECT experience_id, technology FROM portfolio_experience_stack ORDER BY experience_id, sort_order"),
		sourcePool.query("SELECT experience_id, highlight FROM portfolio_experience_highlights ORDER BY experience_id, sort_order"),
		sourcePool.query(`SELECT id, experience_id, client, title, period, category, metric, description
			FROM portfolio_projects ORDER BY sort_order`),
		sourcePool.query("SELECT project_id, technology FROM portfolio_project_stack ORDER BY project_id, sort_order"),
		sourcePool.query("SELECT project_id, highlight FROM portfolio_project_highlights ORDER BY project_id, sort_order"),
		sourcePool.query(`SELECT id, repo, title, category, description, repo_url AS "repoUrl", live_url AS "liveUrl"
			FROM portfolio_personal_projects ORDER BY sort_order`),
		sourcePool.query("SELECT project_id, technology FROM portfolio_personal_project_stack ORDER BY project_id, sort_order"),
		sourcePool.query("SELECT degree, institution, discipline, years, result FROM portfolio_education WHERE record_id = 1"),
		sourcePool.query("SELECT name FROM portfolio_certifications ORDER BY sort_order"),
	]);

	const home = { ...profileResult.rows[0], leetcode: { url: leetcodeResult.rows[0]?.url }, highlights: highlightResult.rows };
	const about = {
		aboutPoints: aboutResult.rows,
		education: educationResult.rows[0],
		certifications: certificationResult.rows.map((row) => row.name),
	};
	const skillGroups = skillGroupResult.rows.map((group) => ({ ...group, items: [] }));
	const skillGroupsById = new Map(skillGroups.map((group) => [group.id, group]));
	for (const item of skillItemResult.rows) skillGroupsById.get(item.group_id)?.items.push({ name: item.name, level: item.level });
	const experience = experienceResult.rows.map((role) => ({
		sourceId: role.id,
		company: role.company,
		role: role.role,
		dates: role.dates,
		location: role.location,
		mark: role.mark,
		logo: role.logo,
		current: role.current,
		summary: role.summary,
		stack: [],
		highlights: [],
		projects: [],
	}));
	const experiencesById = new Map(experience.map((role) => [role.sourceId, role]));
	for (const item of experienceStackResult.rows) experiencesById.get(item.experience_id)?.stack.push(item.technology);
	for (const item of experienceHighlightResult.rows) experiencesById.get(item.experience_id)?.highlights.push(item.highlight);
	const projectsById = new Map();
	for (const row of projectResult.rows) {
		const project = {
			sourceId: row.id,
			client: row.client,
			title: row.title,
			period: row.period,
			category: row.category,
			metric: row.metric,
			description: row.description,
			stack: [],
			highlights: [],
		};
		projectsById.set(row.id, project);
		experiencesById.get(row.experience_id)?.projects.push(project);
	}
	for (const item of projectStackResult.rows) projectsById.get(item.project_id)?.stack.push(item.technology);
	for (const item of projectHighlightResult.rows) projectsById.get(item.project_id)?.highlights.push(item.highlight);
	const projects = experience.flatMap((role) => role.projects);
	const personalProjects = personalProjectResult.rows.map((project) => ({
		sourceId: project.id,
		repo: project.repo,
		title: project.title,
		category: project.category,
		description: project.description,
		repoUrl: project.repoUrl,
		liveUrl: project.liveUrl,
		stack: [],
	}));
	const personalProjectsById = new Map(personalProjects.map((project) => [project.sourceId, project]));
	for (const item of personalStackResult.rows) personalProjectsById.get(item.project_id)?.stack.push(item.technology);
	const lab = { personalProjects };
	const leetcode = leetcodeResult.rows[0];
	console.log("Source portfolio rows loaded.", {
		experiences: experience.length,
		projects: projects.length,
		skillGroups: skillGroups.length,
		personalProjects: lab.personalProjects.length,
	});
	assert.ok(home.name && home.profile && leetcode);
	assert.ok(experience.length > 0 && projects.length > 0 && skillGroups.length > 0);
	assert.ok(about.education && lab.personalProjects.length > 0);

	await targetClient.query("BEGIN");
	console.log("Target transaction started.");
	console.log("Checking target schema.");
	const schema = await targetClient.query(`
		SELECT
			to_regclass('public.portfolio_profile') IS NOT NULL AS normalized_schema,
			to_regclass('public.portfolio_content') IS NULL AS legacy_removed
	`);
	assert.equal(schema.rows[0].normalized_schema, true, "Target normalized schema must be migrated first.");
	assert.equal(schema.rows[0].legacy_removed, true, "Target legacy JSON table must already be removed.");

	console.log("Resetting target portfolio tables.");
	await targetClient.query(`
		TRUNCATE TABLE
			portfolio_profile,
			portfolio_leetcode,
			portfolio_highlights,
			portfolio_about_points,
			portfolio_skill_groups,
			portfolio_skill_items,
			portfolio_experience,
			portfolio_experience_stack,
			portfolio_experience_highlights,
			portfolio_projects,
			portfolio_project_stack,
			portfolio_project_highlights,
			portfolio_personal_projects,
			portfolio_personal_project_stack,
			portfolio_education,
			portfolio_certifications
		RESTART IDENTITY
	`);
	console.log("Target portfolio tables reset.");

	await targetClient.query(`
		INSERT INTO portfolio_profile (
			profile_id, name, short_name, assistant_name, title, location, email, phones,
			linkedin_url, github_url, resume_url, photo_url, profile_summary
		)
		VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`, [home.name, home.shortName, home.assistantName, home.title, home.location, home.email, home.phones, home.linkedin, home.github, home.resume, home.photo, home.profile]);

	await targetClient.query(`
		INSERT INTO portfolio_leetcode (
			profile_id, url, username, global_rank, solved, acceptance, active_days, max_streak, languages, focus
		)
		VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, [leetcode.url, leetcode.username, leetcode.global_rank, leetcode.solved, leetcode.acceptance, leetcode.active_days, leetcode.max_streak, leetcode.languages, leetcode.focus]);
	console.log("Profile rows inserted.");

	await insertRows(targetClient, "portfolio_highlights", ["sort_order", "value", "label"],
		home.highlights.map((highlight, index) => [index + 1, highlight.value, highlight.label]));
	await insertRows(targetClient, "portfolio_about_points", ["sort_order", "label", "content"],
		about.aboutPoints.map((point, index) => [index + 1, point.label, point.text]));
	console.log("Profile highlights inserted.");

	const skillItemRows = [];
	console.log("Inserting skill groups.", { count: skillGroups.length });
	for (const [groupIndex, group] of skillGroups.entries()) {
		const { rows: [skillGroup] } = await targetClient.query(
			"INSERT INTO portfolio_skill_groups (sort_order, category, icon) VALUES ($1, $2, $3) RETURNING id",
			[groupIndex + 1, group.category, group.icon]
		);
		console.log("Skill group inserted.", { category: group.category });
		for (const [itemIndex, item] of group.items.entries()) {
			skillItemRows.push([skillGroup.id, itemIndex + 1, item.name, item.level]);
		}
	}
	console.log("Inserting skill items.", { count: skillItemRows.length });
	await insertRows(targetClient, "portfolio_skill_items", ["group_id", "sort_order", "name", "level"], skillItemRows);
	console.log("Skills inserted.");

	const experienceIds = new Map();
	const experienceStackRows = [];
	const experienceHighlightRows = [];
	console.log("Inserting experience rows.", { count: experience.length });
	for (const [roleIndex, role] of experience.entries()) {
		const { rows: [experienceRow] } = await targetClient.query(`
			INSERT INTO portfolio_experience (sort_order, company, role, dates, location, mark, logo, is_current, summary)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			RETURNING id
		`, [roleIndex + 1, role.company, role.role, role.dates, role.location, role.mark, role.logo, role.current, role.summary]);
		experienceIds.set(role.company, experienceRow.id);
		console.log("Experience row inserted.", { company: role.company });

		for (const [index, technology] of role.stack.entries()) {
			experienceStackRows.push([experienceRow.id, index + 1, technology]);
		}
		for (const [index, highlight] of role.highlights.entries()) {
			experienceHighlightRows.push([experienceRow.id, index + 1, highlight]);
		}
	}
	await insertRows(targetClient, "portfolio_experience_stack", ["experience_id", "sort_order", "technology"], experienceStackRows);
	await insertRows(targetClient, "portfolio_experience_highlights", ["experience_id", "sort_order", "highlight"], experienceHighlightRows);
	console.log("Experience inserted.");

	const projectStackRows = [];
	const projectHighlightRows = [];
	console.log("Inserting client projects.", { count: projects.length });
	for (const [index, project] of projects.entries()) {
		const experienceId = experienceIds.get(project.client);
		assert.ok(experienceId, `No experience row found for project client ${project.client}.`);
		const { rows: [projectRow] } = await targetClient.query(`
			INSERT INTO portfolio_projects (sort_order, experience_id, client, title, period, category, metric, description)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			RETURNING id
		`, [index + 1, experienceId, project.client, project.title, project.period, project.category, project.metric, project.description]);
		console.log("Client project inserted.", { index: index + 1 });
		for (const [stackIndex, technology] of project.stack.entries()) {
			projectStackRows.push([projectRow.id, stackIndex + 1, technology]);
		}
		for (const [highlightIndex, highlight] of project.highlights.entries()) {
			projectHighlightRows.push([projectRow.id, highlightIndex + 1, highlight]);
		}
	}
	await insertRows(targetClient, "portfolio_project_stack", ["project_id", "sort_order", "technology"], projectStackRows);
	await insertRows(targetClient, "portfolio_project_highlights", ["project_id", "sort_order", "highlight"], projectHighlightRows);
	console.log("Client projects inserted.");

	const personalStackRows = [];
	console.log("Inserting personal projects.", { count: lab.personalProjects.length });
	for (const [index, project] of lab.personalProjects.entries()) {
		const { rows: [projectRow] } = await targetClient.query(`
			INSERT INTO portfolio_personal_projects (sort_order, repo, title, category, description, repo_url, live_url)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING id
		`, [index + 1, project.repo, project.title, project.category, project.description, project.repoUrl, project.liveUrl]);
		console.log("Personal project inserted.", { index: index + 1 });
		for (const [stackIndex, technology] of project.stack.entries()) {
			personalStackRows.push([projectRow.id, stackIndex + 1, technology]);
		}
	}
	await insertRows(targetClient, "portfolio_personal_project_stack", ["project_id", "sort_order", "technology"], personalStackRows);
	console.log("Personal projects inserted.");

	await targetClient.query(`
		INSERT INTO portfolio_education (record_id, degree, institution, discipline, years, result)
		VALUES (1, $1, $2, $3, $4, $5)
	`, [about.education.degree, about.education.institution, about.education.discipline, about.education.years, about.education.result]);
	await insertRows(targetClient, "portfolio_certifications", ["sort_order", "name"],
		about.certifications.map((certification, index) => [index + 1, certification]));
	console.log("Education and certifications inserted.");

	const { rows: [counts] } = await targetClient.query(`
		SELECT
			(SELECT COUNT(*)::INTEGER FROM portfolio_profile) AS profiles,
			(SELECT COUNT(*)::INTEGER FROM portfolio_skill_groups) AS skill_groups,
			(SELECT COUNT(*)::INTEGER FROM portfolio_experience) AS experiences,
			(SELECT COUNT(*)::INTEGER FROM portfolio_projects) AS projects,
			(SELECT COUNT(*)::INTEGER FROM portfolio_personal_projects) AS personal_projects,
			(SELECT COUNT(*)::INTEGER FROM portfolio_projects WHERE experience_id IS NULL) AS unlinked_projects,
			(SELECT COUNT(*)::INTEGER FROM portfolio_skill_items item JOIN portfolio_skill_groups group_row ON group_row.id = item.group_id WHERE group_row.category = 'Cloud & DevOps' AND item.name NOT IN ('AWS', 'Azure')) AS unexpected_cloud_skills,
			(SELECT COUNT(*)::INTEGER FROM portfolio_skill_items item JOIN portfolio_skill_groups group_row ON group_row.id = item.group_id WHERE group_row.category = 'Backend & APIs' AND item.name = 'Python · FastAPI') AS fastapi_skill,
			(SELECT COUNT(*)::INTEGER FROM portfolio_skill_items item JOIN portfolio_skill_groups group_row ON group_row.id = item.group_id WHERE group_row.category = 'Data, AI & Quality' AND item.name = 'Power BI · MicroStrategy') AS removed_bi_skill
	`);
	assert.equal(counts.profiles, 1);
	assert.equal(counts.skill_groups, skillGroups.length);
	assert.equal(counts.experiences, experience.length);
	assert.equal(counts.projects, projects.length);
	assert.equal(counts.personal_projects, lab.personalProjects.length);
	assert.equal(counts.unlinked_projects, 0);
	assert.equal(counts.unexpected_cloud_skills, 0);
	assert.equal(counts.fastapi_skill, 1);
	assert.equal(counts.removed_bi_skill, 0);
	console.log("Target row checks passed.");

	await targetClient.query(applyChanges ? "COMMIT" : "ROLLBACK");
	console.log(applyChanges ? "Portfolio data promoted successfully." : "Portfolio data promotion verified; target changes rolled back.", counts);
} catch (error) {
	await targetClient.query("ROLLBACK");
	console.error("Portfolio data promotion failed.", { code: typeof error?.code === "string" ? error.code : error?.name || "UNKNOWN" });
	throw error;
} finally {
	targetClient.release();
	await Promise.all([sourcePool.end(), targetPool.end()]);
}
