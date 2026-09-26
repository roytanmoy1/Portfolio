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
