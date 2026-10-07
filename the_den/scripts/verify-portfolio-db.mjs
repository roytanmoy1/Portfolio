import assert from "node:assert/strict";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL_UNPOOLED;
if (!databaseUrl) throw new Error("DATABASE_URL_UNPOOLED is required for portfolio DB verification.");
if (new URL(databaseUrl).hostname.includes("-pooler")) {
	throw new Error("Portfolio DB verification requires a direct Neon connection.");
}

const pool = new Pool({ connectionString: databaseUrl, max: 1 });

try {
	const { rows: [result] } = await pool.query(`
		SELECT
			(SELECT COUNT(*)::INTEGER FROM portfolio_profile) AS profiles,
			(SELECT COUNT(*)::INTEGER FROM portfolio_leetcode) AS leetcode_profiles,
			(SELECT COUNT(*)::INTEGER FROM portfolio_highlights) AS highlights,
			(SELECT COUNT(*)::INTEGER FROM portfolio_about_points) AS about_points,
			(SELECT COUNT(*)::INTEGER FROM portfolio_skill_groups) AS skill_groups,
			(SELECT COUNT(*)::INTEGER FROM portfolio_skill_items) AS skills,
			(SELECT COUNT(*)::INTEGER FROM portfolio_experience) AS experiences,
			(SELECT COUNT(*)::INTEGER FROM portfolio_experience_stack) AS experience_stack_items,
			(SELECT COUNT(*)::INTEGER FROM portfolio_experience_highlights) AS experience_highlights,
			(SELECT COUNT(*)::INTEGER FROM portfolio_projects) AS projects,
			(SELECT COUNT(*)::INTEGER FROM portfolio_project_stack) AS project_stack_items,
			(SELECT COUNT(*)::INTEGER FROM portfolio_project_highlights) AS project_highlights,
			(SELECT COUNT(*)::INTEGER FROM portfolio_personal_projects) AS personal_projects,
			(SELECT COUNT(*)::INTEGER FROM portfolio_education) AS education_records,
			(SELECT COUNT(*)::INTEGER FROM portfolio_certifications) AS certifications,
			(SELECT COUNT(*)::INTEGER FROM portfolio_projects WHERE experience_id IS NULL) AS unlinked_projects,
			to_regclass('public.portfolio_content') IS NULL AS legacy_json_removed,
			(SELECT summary FROM portfolio_experience WHERE company = 'Deloitte USI' ORDER BY sort_order DESC LIMIT 1) AS current_summary,
			(SELECT ARRAY_AGG(stack.technology ORDER BY stack.sort_order)
			 FROM portfolio_experience_stack stack
			 JOIN LATERAL (
				 SELECT id FROM portfolio_experience
				 WHERE company = 'Deloitte USI'
				 ORDER BY sort_order DESC
				 LIMIT 1
			 ) experience ON experience.id = stack.experience_id) AS current_stack,
			(SELECT description FROM portfolio_projects WHERE title = 'EPIC Hub') AS first_project_description
	`);

	assert.equal(result.profiles, 1);
	assert.equal(result.leetcode_profiles, 1);
	assert.equal(result.highlights, 4);
	assert.equal(result.about_points, 4);
	assert.equal(result.skill_groups, 4);
	assert.equal(result.experiences, 3);
	assert.equal(result.projects, 5);
	assert.equal(result.personal_projects, 4);
	assert.equal(result.education_records, 1);
	assert.equal(result.certifications, 4);
	assert.equal(result.unlinked_projects, 0);
	assert.equal(result.legacy_json_removed, true);
	assert.match(result.current_summary, /Leads a three-engineer team/);
	assert.ok(result.current_stack.includes("GraphDB"));
	assert.match(result.first_project_description, /central operations platform/);

	const counts = Object.fromEntries(Object.entries(result).filter(([key]) => ![
		"current_summary",
		"current_stack",
		"first_project_description",
	].includes(key)));
	console.log("Normalized portfolio data verified.", counts);
} finally {
	await pool.end();
}
