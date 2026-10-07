CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS portfolio_profile (
	profile_id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (profile_id = 1),
	name TEXT NOT NULL,
	short_name TEXT NOT NULL,
	assistant_name TEXT NOT NULL,
	title TEXT NOT NULL,
	location TEXT NOT NULL,
	email TEXT NOT NULL,
	phones TEXT[] NOT NULL DEFAULT '{}',
	linkedin_url TEXT NOT NULL,
	github_url TEXT NOT NULL,
	resume_url TEXT NOT NULL,
	photo_url TEXT NOT NULL,
	profile_summary TEXT NOT NULL,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portfolio_leetcode (
	profile_id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (profile_id = 1),
	url TEXT NOT NULL,
	username TEXT NOT NULL,
	global_rank TEXT NOT NULL,
	solved TEXT NOT NULL,
	acceptance TEXT NOT NULL,
	active_days TEXT NOT NULL,
	max_streak TEXT NOT NULL,
	languages TEXT[] NOT NULL DEFAULT '{}',
	focus TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS portfolio_highlights (
	sort_order INTEGER PRIMARY KEY,
	value TEXT NOT NULL,
	label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS portfolio_about_points (
	sort_order INTEGER PRIMARY KEY,
	label TEXT NOT NULL,
	content TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS portfolio_skill_groups (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	sort_order INTEGER NOT NULL UNIQUE,
	category TEXT NOT NULL UNIQUE,
	icon TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS portfolio_skill_items (
	group_id BIGINT NOT NULL REFERENCES portfolio_skill_groups(id) ON DELETE CASCADE,
	sort_order INTEGER NOT NULL,
	name TEXT NOT NULL,
	level SMALLINT NOT NULL CHECK (level BETWEEN 0 AND 100),
	PRIMARY KEY (group_id, sort_order)
);

CREATE TABLE IF NOT EXISTS portfolio_experience (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	sort_order INTEGER NOT NULL UNIQUE,
	company TEXT NOT NULL,
	role TEXT NOT NULL,
	dates TEXT NOT NULL,
	location TEXT NOT NULL,
	mark TEXT NOT NULL,
	logo TEXT,
	is_current BOOLEAN NOT NULL DEFAULT FALSE,
	summary TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS portfolio_experience_stack (
	experience_id BIGINT NOT NULL REFERENCES portfolio_experience(id) ON DELETE CASCADE,
	sort_order INTEGER NOT NULL,
	technology TEXT NOT NULL,
	PRIMARY KEY (experience_id, sort_order)
);

CREATE TABLE IF NOT EXISTS portfolio_experience_highlights (
	experience_id BIGINT NOT NULL REFERENCES portfolio_experience(id) ON DELETE CASCADE,
	sort_order INTEGER NOT NULL,
	highlight TEXT NOT NULL,
	PRIMARY KEY (experience_id, sort_order)
);

CREATE TABLE IF NOT EXISTS portfolio_projects (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	sort_order INTEGER NOT NULL UNIQUE,
	experience_id BIGINT REFERENCES portfolio_experience(id) ON DELETE SET NULL,
	client TEXT NOT NULL,
	title TEXT NOT NULL,
	period TEXT NOT NULL,
	category TEXT NOT NULL,
	metric TEXT NOT NULL,
	description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS portfolio_project_stack (
	project_id BIGINT NOT NULL REFERENCES portfolio_projects(id) ON DELETE CASCADE,
	sort_order INTEGER NOT NULL,
	technology TEXT NOT NULL,
	PRIMARY KEY (project_id, sort_order)
);

CREATE TABLE IF NOT EXISTS portfolio_project_highlights (
	project_id BIGINT NOT NULL REFERENCES portfolio_projects(id) ON DELETE CASCADE,
	sort_order INTEGER NOT NULL,
	highlight TEXT NOT NULL,
	PRIMARY KEY (project_id, sort_order)
);

CREATE TABLE IF NOT EXISTS portfolio_personal_projects (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	sort_order INTEGER NOT NULL UNIQUE,
	repo TEXT NOT NULL UNIQUE,
	title TEXT NOT NULL,
	category TEXT NOT NULL,
	description TEXT NOT NULL,
	repo_url TEXT NOT NULL,
	live_url TEXT
);

CREATE TABLE IF NOT EXISTS portfolio_personal_project_stack (
	project_id BIGINT NOT NULL REFERENCES portfolio_personal_projects(id) ON DELETE CASCADE,
	sort_order INTEGER NOT NULL,
	technology TEXT NOT NULL,
	PRIMARY KEY (project_id, sort_order)
);

CREATE TABLE IF NOT EXISTS portfolio_education (
	record_id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (record_id = 1),
	degree TEXT NOT NULL,
	institution TEXT NOT NULL,
	discipline TEXT NOT NULL,
	years TEXT NOT NULL,
	result TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS portfolio_certifications (
	sort_order INTEGER PRIMARY KEY,
	name TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS portfolio_projects_experience_sort_idx
	ON portfolio_projects (experience_id, sort_order);

DO $portfolio_migration$
DECLARE
	portfolio JSONB;
	entry RECORD;
	child RECORD;
	v_group_id BIGINT;
	v_experience_id BIGINT;
	v_project_id BIGINT;
BEGIN
	IF to_regclass('public.portfolio_content') IS NULL THEN
		RETURN;
	END IF;

	EXECUTE 'SELECT content FROM public.portfolio_content WHERE content_key = $1 LIMIT 1'
		INTO portfolio
		USING 'portfolio';

	IF portfolio IS NULL THEN
		RAISE EXCEPTION 'Legacy portfolio content is missing; refusing to remove its table.';
	END IF;

	INSERT INTO portfolio_profile (
		profile_id, name, short_name, assistant_name, title, location, email, phones,
		linkedin_url, github_url, resume_url, photo_url, profile_summary, updated_at
	)
	VALUES (
		1,
		portfolio->>'name',
		portfolio->>'shortName',
		COALESCE(portfolio->>'assistantName', 'Ask Tanmoy'),
		portfolio->>'title',
		portfolio->>'location',
		portfolio->>'email',
		ARRAY(SELECT jsonb_array_elements_text(portfolio->'phones')),
		portfolio->>'linkedin',
		portfolio->>'github',
		portfolio->>'resume',
		portfolio->>'photo',
		portfolio->>'profile',
		NOW()
	)
	ON CONFLICT (profile_id) DO UPDATE SET
		name = EXCLUDED.name,
		short_name = EXCLUDED.short_name,
		assistant_name = EXCLUDED.assistant_name,
		title = EXCLUDED.title,
		location = EXCLUDED.location,
		email = EXCLUDED.email,
		phones = EXCLUDED.phones,
		linkedin_url = EXCLUDED.linkedin_url,
		github_url = EXCLUDED.github_url,
		resume_url = EXCLUDED.resume_url,
		photo_url = EXCLUDED.photo_url,
		profile_summary = EXCLUDED.profile_summary,
		updated_at = NOW();

	INSERT INTO portfolio_leetcode (
		profile_id, url, username, global_rank, solved, acceptance, active_days, max_streak, languages, focus
	)
	VALUES (
		1,
		portfolio->'leetcode'->>'url',
		portfolio->'leetcode'->>'username',
		portfolio->'leetcode'->>'rank',
		portfolio->'leetcode'->>'solved',
		portfolio->'leetcode'->>'acceptance',
		portfolio->'leetcode'->>'activeDays',
		portfolio->'leetcode'->>'maxStreak',
		ARRAY(SELECT jsonb_array_elements_text(portfolio->'leetcode'->'languages')),
		ARRAY(SELECT jsonb_array_elements_text(portfolio->'leetcode'->'focus'))
	)
	ON CONFLICT (profile_id) DO UPDATE SET
		url = EXCLUDED.url,
		username = EXCLUDED.username,
		global_rank = EXCLUDED.global_rank,
		solved = EXCLUDED.solved,
		acceptance = EXCLUDED.acceptance,
		active_days = EXCLUDED.active_days,
		max_streak = EXCLUDED.max_streak,
		languages = EXCLUDED.languages,
		focus = EXCLUDED.focus;

	FOR entry IN
		SELECT value, ordinality::INTEGER AS sort_order
		FROM jsonb_array_elements(portfolio->'highlights') WITH ORDINALITY AS source(value, ordinality)
	LOOP
		INSERT INTO portfolio_highlights (sort_order, value, label)
		VALUES (entry.sort_order, entry.value->>'value', entry.value->>'label')
		ON CONFLICT (sort_order) DO UPDATE SET
			value = EXCLUDED.value,
			label = EXCLUDED.label;
	END LOOP;

	FOR entry IN
		SELECT value, ordinality::INTEGER AS sort_order
		FROM jsonb_array_elements(portfolio->'aboutPoints') WITH ORDINALITY AS source(value, ordinality)
	LOOP
		INSERT INTO portfolio_about_points (sort_order, label, content)
		VALUES (entry.sort_order, entry.value->>'label', entry.value->>'text')
		ON CONFLICT (sort_order) DO UPDATE SET
			label = EXCLUDED.label,
			content = EXCLUDED.content;
	END LOOP;

	FOR entry IN
		SELECT value, ordinality::INTEGER AS sort_order
		FROM jsonb_array_elements(portfolio->'skills') WITH ORDINALITY AS source(value, ordinality)
	LOOP
		INSERT INTO portfolio_skill_groups (sort_order, category, icon)
		VALUES (entry.sort_order, entry.value->>'category', entry.value->>'icon')
		ON CONFLICT (sort_order) DO UPDATE SET
			category = EXCLUDED.category,
			icon = EXCLUDED.icon
		RETURNING id INTO v_group_id;

		DELETE FROM portfolio_skill_items WHERE portfolio_skill_items.group_id = v_group_id;
		FOR child IN
			SELECT value, ordinality::INTEGER AS sort_order
			FROM jsonb_array_elements(entry.value->'items') WITH ORDINALITY AS skill(value, ordinality)
		LOOP
			INSERT INTO portfolio_skill_items (group_id, sort_order, name, level)
			VALUES (v_group_id, child.sort_order, child.value->>'name', (child.value->>'level')::SMALLINT);
		END LOOP;
	END LOOP;

	FOR entry IN
		SELECT value, ordinality::INTEGER AS sort_order
		FROM jsonb_array_elements(portfolio->'experience') WITH ORDINALITY AS source(value, ordinality)
	LOOP
		INSERT INTO portfolio_experience (
			sort_order, company, role, dates, location, mark, logo, is_current, summary
		)
		VALUES (
			entry.sort_order,
			entry.value->>'company',
			entry.value->>'role',
			entry.value->>'dates',
			entry.value->>'location',
			entry.value->>'mark',
			entry.value->>'logo',
			COALESCE((entry.value->>'current')::BOOLEAN, FALSE),
			entry.value->>'summary'
		)
		ON CONFLICT (sort_order) DO UPDATE SET
			company = EXCLUDED.company,
			role = EXCLUDED.role,
			dates = EXCLUDED.dates,
			location = EXCLUDED.location,
			mark = EXCLUDED.mark,
			logo = EXCLUDED.logo,
			is_current = EXCLUDED.is_current,
			summary = EXCLUDED.summary
		RETURNING id INTO v_experience_id;

		DELETE FROM portfolio_experience_stack WHERE portfolio_experience_stack.experience_id = v_experience_id;
		FOR child IN
			SELECT value, ordinality::INTEGER AS sort_order
			FROM jsonb_array_elements(entry.value->'stack') WITH ORDINALITY AS stack_item(value, ordinality)
		LOOP
			INSERT INTO portfolio_experience_stack (experience_id, sort_order, technology)
			VALUES (v_experience_id, child.sort_order, child.value #>> '{}');
		END LOOP;

		DELETE FROM portfolio_experience_highlights WHERE portfolio_experience_highlights.experience_id = v_experience_id;
		FOR child IN
			SELECT value, ordinality::INTEGER AS sort_order
			FROM jsonb_array_elements(entry.value->'highlights') WITH ORDINALITY AS point(value, ordinality)
		LOOP
			INSERT INTO portfolio_experience_highlights (experience_id, sort_order, highlight)
			VALUES (v_experience_id, child.sort_order, child.value #>> '{}');
		END LOOP;
	END LOOP;

	FOR entry IN
		SELECT value, ordinality::INTEGER AS sort_order
		FROM jsonb_array_elements(portfolio->'projects') WITH ORDINALITY AS source(value, ordinality)
	LOOP
		SELECT id INTO v_experience_id
		FROM portfolio_experience
		WHERE company = entry.value->>'client'
		ORDER BY sort_order DESC
		LIMIT 1;

		INSERT INTO portfolio_projects (
			sort_order, experience_id, client, title, period, category, metric, description
		)
		VALUES (
			entry.sort_order,
			v_experience_id,
			entry.value->>'client',
			entry.value->>'title',
			entry.value->>'period',
			entry.value->>'category',
			entry.value->>'metric',
			entry.value->>'description'
		)
		ON CONFLICT (sort_order) DO UPDATE SET
			experience_id = EXCLUDED.experience_id,
			client = EXCLUDED.client,
			title = EXCLUDED.title,
			period = EXCLUDED.period,
			category = EXCLUDED.category,
			metric = EXCLUDED.metric,
			description = EXCLUDED.description
		RETURNING id INTO v_project_id;

		DELETE FROM portfolio_project_stack WHERE portfolio_project_stack.project_id = v_project_id;
		FOR child IN
			SELECT value, ordinality::INTEGER AS sort_order
			FROM jsonb_array_elements(entry.value->'stack') WITH ORDINALITY AS stack_item(value, ordinality)
		LOOP
			INSERT INTO portfolio_project_stack (project_id, sort_order, technology)
			VALUES (v_project_id, child.sort_order, child.value #>> '{}');
		END LOOP;

		DELETE FROM portfolio_project_highlights WHERE portfolio_project_highlights.project_id = v_project_id;
		FOR child IN
			SELECT value, ordinality::INTEGER AS sort_order
			FROM jsonb_array_elements(entry.value->'highlights') WITH ORDINALITY AS point(value, ordinality)
		LOOP
			INSERT INTO portfolio_project_highlights (project_id, sort_order, highlight)
			VALUES (v_project_id, child.sort_order, child.value #>> '{}');
		END LOOP;
	END LOOP;

	FOR entry IN
		SELECT value, ordinality::INTEGER AS sort_order
		FROM jsonb_array_elements(portfolio->'personalProjects') WITH ORDINALITY AS source(value, ordinality)
	LOOP
		INSERT INTO portfolio_personal_projects (
			sort_order, repo, title, category, description, repo_url, live_url
		)
		VALUES (
			entry.sort_order,
			entry.value->>'repo',
			entry.value->>'title',
			entry.value->>'category',
			entry.value->>'description',
			entry.value->>'repoUrl',
			entry.value->>'liveUrl'
		)
		ON CONFLICT (sort_order) DO UPDATE SET
			repo = EXCLUDED.repo,
			title = EXCLUDED.title,
			category = EXCLUDED.category,
			description = EXCLUDED.description,
			repo_url = EXCLUDED.repo_url,
			live_url = EXCLUDED.live_url
		RETURNING id INTO v_project_id;

		DELETE FROM portfolio_personal_project_stack WHERE portfolio_personal_project_stack.project_id = v_project_id;
		FOR child IN
			SELECT value, ordinality::INTEGER AS sort_order
			FROM jsonb_array_elements(entry.value->'stack') WITH ORDINALITY AS stack_item(value, ordinality)
		LOOP
			INSERT INTO portfolio_personal_project_stack (project_id, sort_order, technology)
			VALUES (v_project_id, child.sort_order, child.value #>> '{}');
		END LOOP;
	END LOOP;

	INSERT INTO portfolio_education (record_id, degree, institution, discipline, years, result)
	VALUES (
		1,
		portfolio->'education'->>'degree',
		portfolio->'education'->>'institution',
		portfolio->'education'->>'discipline',
		portfolio->'education'->>'years',
		portfolio->'education'->>'result'
	)
	ON CONFLICT (record_id) DO UPDATE SET
		degree = EXCLUDED.degree,
		institution = EXCLUDED.institution,
		discipline = EXCLUDED.discipline,
		years = EXCLUDED.years,
		result = EXCLUDED.result;

	FOR entry IN
		SELECT value, ordinality::INTEGER AS sort_order
		FROM jsonb_array_elements(portfolio->'certifications') WITH ORDINALITY AS source(value, ordinality)
	LOOP
		INSERT INTO portfolio_certifications (sort_order, name)
		VALUES (entry.sort_order, entry.value #>> '{}')
		ON CONFLICT (sort_order) DO UPDATE SET name = EXCLUDED.name;
	END LOOP;
END
$portfolio_migration$;

DROP TABLE IF EXISTS portfolio_content;

CREATE TABLE IF NOT EXISTS contact_messages (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name VARCHAR(80) NOT NULL,
	email VARCHAR(254) NOT NULL,
	message VARCHAR(4000) NOT NULL,
	status TEXT NOT NULL DEFAULT 'received',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
	ON contact_messages (created_at DESC);

CREATE TABLE IF NOT EXISTS chat_uploads (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	session_id UUID NOT NULL,
	original_name VARCHAR(120) NOT NULL,
	mime_type VARCHAR(64) NOT NULL,
	size_bytes INTEGER NOT NULL CHECK (size_bytes BETWEEN 1 AND 2097152),
	sha256 CHAR(64) NOT NULL,
	encrypted_content BYTEA NOT NULL,
	encryption_iv BYTEA NOT NULL CHECK (OCTET_LENGTH(encryption_iv) = 12),
	encryption_tag BYTEA NOT NULL CHECK (OCTET_LENGTH(encryption_tag) = 16),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS chat_uploads_session_expires_idx
	ON chat_uploads (session_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	session_id UUID NOT NULL,
	visitor_name VARCHAR(60) NOT NULL,
	question VARCHAR(500) NOT NULL,
	response VARCHAR(1800) NOT NULL,
	status VARCHAR(16) NOT NULL CHECK (status IN ('answered', 'refused', 'error')),
	model VARCHAR(64),
	attachment_count SMALLINT NOT NULL DEFAULT 0 CHECK (attachment_count BETWEEN 0 AND 5),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '90 days'
);

CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx
	ON chat_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS chat_messages_session_created_idx
	ON chat_messages (session_id, created_at DESC);
