import { createApp } from './app';
import { config } from './config';
import { cache } from './services/cache';
import { rateLimiter } from './services/rate-limiter';

async function main(): Promise<void> {
  const app = createApp();

  await Promise.all([
    cache.connect().catch(() => console.warn('Redis unavailable, running without cache')),
    rateLimiter.connect().catch(() => console.warn('Redis unavailable for rate limiter')),
  ]);

  app.listen(config.port, () => {
    console.log(`ShardLink running on port ${config.port}`);
  });
}

main().catch(console.error);
