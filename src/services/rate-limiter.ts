import Redis from 'ioredis';
import { config } from '../config';

export class RateLimiterService {
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

  async check(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; remaining: number; reset: number }> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const reset = Math.ceil((now + windowMs) / 1000);

    const script = `
      redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1])
      local count = redis.call('ZCARD', KEYS[1])
      if count < tonumber(ARGV[2]) then
        redis.call('ZADD', KEYS[1], ARGV[3], ARGV[3])
        redis.call('EXPIRE', KEYS[1], ARGV[4])
        return {1, count + 1}
      end
      return {0, count}
    `;

    try {
      const result = await this.client.eval(
        script,
        1,
        key,
        windowStart.toString(),
        limit.toString(),
        now.toString(),
        Math.ceil(windowMs / 1000).toString()
      ) as [number, number];

      const allowed = result[0] === 1;
      const remaining = Math.max(0, limit - result[1]);

      return { allowed, remaining, reset };
    } catch {
      return { allowed: true, remaining: limit, reset };
    }
  }
}

export const rateLimiter = new RateLimiterService();
