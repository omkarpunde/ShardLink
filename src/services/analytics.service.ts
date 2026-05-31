import { Pool } from 'pg';
import UAParserModule from 'ua-parser-js';
import { config } from '../config';
import { ring } from './sharding';
import { ClickEvent } from '../types';

const BATCH_INTERVAL_MS = 100;
const BATCH_MAX_SIZE = 100;

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

class AnalyticsBatcher {
  private buffer: ClickEvent[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.flush(), BATCH_INTERVAL_MS);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.flush();
  }

  push(event: ClickEvent): void {
    this.buffer.push(event);
    if (this.buffer.length >= BATCH_MAX_SIZE) {
      this.flush();
    }
  }

  private flush(): void {
    if (this.buffer.length === 0) return;
    const batch = this.buffer.splice(0);
    this.writeBatch(batch).catch((err) => console.error('analytics batch write failed:', err));
  }

  private async writeBatch(events: ClickEvent[]): Promise<void> {
    const byShard = new Map<string, ClickEvent[]>();
    for (const event of events) {
      const shard = ring.getShard(event.slug);
      const arr = byShard.get(shard.name);
      if (arr) {
        arr.push(event);
      } else {
        byShard.set(shard.name, [event]);
      }
    }

    const promises: Promise<void>[] = [];
    for (const [shardName, shardEvents] of byShard) {
      promises.push(this.insertBatch(shardName, shardEvents));
    }
    await Promise.all(promises);
  }

  private async insertBatch(shardName: string, events: ClickEvent[]): Promise<void> {
    const pool = getPool(shardName);

    const values: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    for (const e of events) {
      values.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, NOW())`);
      params.push(e.slug, e.ip, e.user_agent, e.referer, e.country, e.device);
    }

    const sql = `INSERT INTO clicks (slug, ip, user_agent, referer, country, device, clicked_at) VALUES ${values.join(', ')}`;

    const countSql = `
      UPDATE urls SET click_count = click_count + 1, updated_at = NOW()
      WHERE slug = $1
    `;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql, params);
      const uniqueSlugs = [...new Set(events.map((e) => e.slug))];
      for (const slug of uniqueSlugs) {
        await client.query(countSql, [slug]);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export class AnalyticsService {
  private batcher: AnalyticsBatcher;

  constructor() {
    this.batcher = new AnalyticsBatcher();
  }

  start(): void {
    this.batcher.start();
  }

  stop(): void {
    this.batcher.stop();
  }

  trackRedirect(slug: string, ip: string, userAgent: string, referer: string): void {
    const parser = new UAParserModule.UAParser(userAgent);
    const deviceType = parser.getDevice().type || 'desktop';
    const country = 'XX';

    const event: ClickEvent = {
      slug,
      timestamp: new Date(),
      ip,
      user_agent: userAgent,
      referer: this.extractRefererDomain(referer),
      country,
      device: deviceType,
    };

    this.batcher.push(event);
  }

  private extractRefererDomain(referer: string): string {
    if (!referer) return 'direct';
    try {
      const url = new URL(referer);
      return url.hostname;
    } catch {
      return 'unknown';
    }
  }

  async getAnalytics(
    slug: string,
    from: string,
    to: string,
    granularity: 'hour' | 'day'
  ): Promise<{
    total_clicks: number;
    unique_ips: number;
    timeseries: { date: string; clicks: number }[];
    by_country: { country: string; clicks: number }[];
    by_device: { device: string; clicks: number }[];
  }> {
    const shard = ring.getShard(slug);
    const pool = getPool(shard.name);

    const dateTrunc = granularity === 'hour' ? 'date_trunc(\'hour\', clicked_at)' : 'date_trunc(\'day\', clicked_at)';

    const [totalResult, timeseriesResult, countryResult, deviceResult] = await Promise.all([
      pool.query(
        'SELECT COUNT(*) as total, COUNT(DISTINCT ip) as unique_ips FROM clicks WHERE slug = $1 AND clicked_at >= $2 AND clicked_at <= $3',
        [slug, from, to]
      ),
      pool.query(
        `SELECT ${dateTrunc} as bucket, COUNT(*) as clicks FROM clicks WHERE slug = $1 AND clicked_at >= $2 AND clicked_at <= $3 GROUP BY bucket ORDER BY bucket`,
        [slug, from, to]
      ),
      pool.query(
        'SELECT country, COUNT(*) as clicks FROM clicks WHERE slug = $1 AND clicked_at >= $2 AND clicked_at <= $3 GROUP BY country ORDER BY clicks DESC',
        [slug, from, to]
      ),
      pool.query(
        'SELECT device, COUNT(*) as clicks FROM clicks WHERE slug = $1 AND clicked_at >= $2 AND clicked_at <= $3 GROUP BY device ORDER BY clicks DESC',
        [slug, from, to]
      ),
    ]);

    return {
      total_clicks: parseInt(totalResult.rows[0]?.total ?? '0', 10),
      unique_ips: parseInt(totalResult.rows[0]?.unique_ips ?? '0', 10),
      timeseries: timeseriesResult.rows.map((r) => ({
        date: r.bucket.toISOString(),
        clicks: parseInt(r.clicks, 10),
      })),
      by_country: countryResult.rows.map((r) => ({
        country: r.country,
        clicks: parseInt(r.clicks, 10),
      })),
      by_device: deviceResult.rows.map((r) => ({
        device: r.device,
        clicks: parseInt(r.clicks, 10),
      })),
    };
  }
}

export const analytics = new AnalyticsService();
