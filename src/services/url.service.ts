import { Pool } from 'pg';
import { config } from '../config';
import { ring } from './sharding';
import { cache } from './cache';
import { generateSlug } from '../utils/slug';
import { UrlRecord, CreateUrlRequest } from '../types';

const CACHE_TTL = 86400;

function createPool(): Pool {
  return new Pool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
  });
}

const pools = new Map<string, Pool>();
function getPool(shardName: string): Pool {
  if (!pools.has(shardName)) {
    pools.set(shardName, createPool());
  }
  return pools.get(shardName)!;
}

export class UrlService {
  async createUrl(req: CreateUrlRequest): Promise<UrlRecord> {
    const slug = req.custom_slug || generateSlug();

    const shard = ring.getShard(slug);
    const pool = getPool(shard.name);

    const expiresAt = req.ttl_seconds
      ? new Date(Date.now() + req.ttl_seconds * 1000)
      : null;

    const result = await pool.query(
      `INSERT INTO urls (slug, long_url, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO NOTHING
       RETURNING *`,
      [slug, req.url, expiresAt]
    );

    if (!result.rows.length) {
      throw Object.assign(new Error('Slug already taken'), { statusCode: 409, code: 'slug_conflict' });
    }

    const url = result.rows[0];
    await cache.set(cache.buildRedirectKey(slug), JSON.stringify(url), CACHE_TTL);

    return url;
  }

  async getUrl(slug: string): Promise<UrlRecord | null> {
    const cached = await cache.get(cache.buildRedirectKey(slug));
    if (cached) {
      return JSON.parse(cached);
    }

    const shard = ring.getShard(slug);
    const pool = getPool(shard.name);

    const result = await pool.query(
      'SELECT * FROM urls WHERE slug = $1 AND (expires_at IS NULL OR expires_at > NOW())',
      [slug]
    );

    if (!result.rows.length) return null;

    const url = result.rows[0];
    await cache.set(cache.buildRedirectKey(slug), JSON.stringify(url), CACHE_TTL);

    return url;
  }

  async deleteUrl(slug: string): Promise<boolean> {
    const shard = ring.getShard(slug);
    const pool = getPool(shard.name);

    const result = await pool.query('DELETE FROM urls WHERE slug = $1', [slug]);
    await cache.del(cache.buildRedirectKey(slug));

    return (result.rowCount ?? 0) > 0;
  }

  async getUrlInfo(slug: string): Promise<UrlRecord | null> {
    return this.getUrl(slug);
  }
}

export const urlService = new UrlService();
