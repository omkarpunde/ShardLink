-- ShardLink: Initial schema
-- Run on each shard.

CREATE TABLE IF NOT EXISTS urls (
    slug VARCHAR(10) PRIMARY KEY,
    long_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    click_count BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS clicks (
    id BIGSERIAL,
    slug VARCHAR(10) NOT NULL REFERENCES urls(slug),
    clicked_at TIMESTAMPTZ DEFAULT NOW(),
    ip VARCHAR(64),
    user_agent TEXT,
    referer TEXT,
    country VARCHAR(2) DEFAULT 'XX',
    device VARCHAR(20) DEFAULT 'desktop'
);

CREATE INDEX IF NOT EXISTS idx_clicks_slug ON clicks(slug);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_clicks_slug_clicked_at ON clicks(slug, clicked_at);
