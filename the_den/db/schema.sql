CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS portfolio_content (
	content_key TEXT PRIMARY KEY,
	content JSONB NOT NULL,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
