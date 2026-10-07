import { cache } from "react";
import { getDatabase } from "./neon.js";

const loadPortfolioSection = async (section) => {
	const database = getDatabase();
	if (!database) throw new Error("Portfolio database is not configured.");

	let rows;
	if (section === "home") {
		rows = await database`
			SELECT jsonb_build_object(
				'name', profile.name,
				'shortName', profile.short_name,
				'assistantName', profile.assistant_name,
				'title', profile.title,
				'location', profile.location,
				'email', profile.email,
				'phones', profile.phones,
				'linkedin', profile.linkedin_url,
				'github', profile.github_url,
				'resume', profile.resume_url,
				'photo', profile.photo_url,
				'profile', profile.profile_summary,
				'highlights', COALESCE((
					SELECT jsonb_agg(jsonb_build_object('value', highlight.value, 'label', highlight.label) ORDER BY highlight.sort_order)
					FROM portfolio_highlights highlight
				), '[]'::jsonb),
				'leetcode', (SELECT jsonb_build_object('url', leetcode.url) FROM portfolio_leetcode leetcode WHERE leetcode.profile_id = profile.profile_id),
				'currentRole', (SELECT jsonb_build_object('role', experience.role, 'company', experience.company)
					FROM portfolio_experience experience
					WHERE experience.is_current
					ORDER BY experience.sort_order
					LIMIT 1)
			) AS data
			FROM portfolio_profile profile
			WHERE profile.profile_id = 1
		`;
	} else if (section === "experience") {
		rows = await database`
			SELECT COALESCE(jsonb_agg(jsonb_build_object(
				'company', experience.company,
				'role', experience.role,
				'dates', experience.dates,
				'location', experience.location,
				'mark', experience.mark,
				'logo', experience.logo,
				'current', experience.is_current,
				'summary', experience.summary,
				'stack', COALESCE((
					SELECT jsonb_agg(stack.technology ORDER BY stack.sort_order)
					FROM portfolio_experience_stack stack
					WHERE stack.experience_id = experience.id
				), '[]'::jsonb),
				'highlights', COALESCE((
					SELECT jsonb_agg(highlight.highlight ORDER BY highlight.sort_order)
					FROM portfolio_experience_highlights highlight
					WHERE highlight.experience_id = experience.id
				), '[]'::jsonb),
				'projects', COALESCE((
					SELECT jsonb_agg(jsonb_build_object(
						'title', project.title,
						'client', project.client,
						'period', project.period,
						'category', project.category,
						'metric', project.metric,
						'description', project.description,
						'stack', COALESCE((
							SELECT jsonb_agg(stack.technology ORDER BY stack.sort_order)
							FROM portfolio_project_stack stack
							WHERE stack.project_id = project.id
						), '[]'::jsonb),
						'highlights', COALESCE((
							SELECT jsonb_agg(highlight.highlight ORDER BY highlight.sort_order)
							FROM portfolio_project_highlights highlight
							WHERE highlight.project_id = project.id
						), '[]'::jsonb)
					) ORDER BY project.sort_order)
					FROM portfolio_projects project
					WHERE project.experience_id = experience.id
				), '[]'::jsonb)
			) ORDER BY experience.sort_order), '[]'::jsonb) AS data
			FROM portfolio_experience experience
		`;
	} else if (section === "skills") {
		rows = await database`
			SELECT COALESCE(jsonb_agg(jsonb_build_object(
				'category', skill_group.category,
				'icon', skill_group.icon,
				'items', COALESCE((
					SELECT jsonb_agg(jsonb_build_object('name', skill.name, 'level', skill.level) ORDER BY skill.sort_order)
					FROM portfolio_skill_items skill
					WHERE skill.group_id = skill_group.id
				), '[]'::jsonb)
			) ORDER BY skill_group.sort_order), '[]'::jsonb) AS data
			FROM portfolio_skill_groups skill_group
		`;
	} else if (section === "about") {
		rows = await database`
			SELECT jsonb_build_object(
				'aboutPoints', COALESCE((
					SELECT jsonb_agg(jsonb_build_object('label', point.label, 'text', point.content) ORDER BY point.sort_order)
					FROM portfolio_about_points point
				), '[]'::jsonb),
				'education', (SELECT jsonb_build_object(
					'degree', education.degree,
					'institution', education.institution,
					'discipline', education.discipline,
					'years', education.years,
					'result', education.result
				) FROM portfolio_education education WHERE education.record_id = 1),
				'certifications', COALESCE((
					SELECT jsonb_agg(certification.name ORDER BY certification.sort_order)
					FROM portfolio_certifications certification
				), '[]'::jsonb)
			) AS data
		`;
	} else if (section === "lab") {
		rows = await database`
			SELECT jsonb_build_object(
				'github', profile.github_url,
				'personalProjects', COALESCE((
					SELECT jsonb_agg(jsonb_build_object(
						'repo', project.repo,
						'title', project.title,
						'category', project.category,
						'description', project.description,
						'repoUrl', project.repo_url,
						'liveUrl', project.live_url,
						'stack', COALESCE((
							SELECT jsonb_agg(stack.technology ORDER BY stack.sort_order)
							FROM portfolio_personal_project_stack stack
							WHERE stack.project_id = project.id
						), '[]'::jsonb)
					) ORDER BY project.sort_order)
					FROM portfolio_personal_projects project
				), '[]'::jsonb)
			) AS data
			FROM portfolio_profile profile
			WHERE profile.profile_id = 1
		`;
	} else {
		throw new Error("Unknown portfolio section.");
	}

	if (!rows.length || !rows[0].data) throw new Error("Portfolio section data is unavailable.");
	return rows[0].data;
};

export const getPortfolioSection = cache(loadPortfolioSection);
