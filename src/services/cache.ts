import Redis from 'ioredis';
import { config } from '../config';

const DEFAULT_TTL = 86400;

export class CacheService {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      enableReadyCheck: true,
      lazyConnect: true,
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
      await this.client.setex(key, ttl, value);
    } catch {
      // silently fail — cache is non-critical
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch {
      // silently fail — cache is non-critical
    }
  }

  buildRedirectKey(slug: string): string {
    return `shardlink:redirect:${slug}`;
  }

  buildRateLimitKey(scope: string, key: string): string {
    return `shardlink:ratelimit:${scope}:${key}`;
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}

export const cache = new CacheService();
