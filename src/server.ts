import { createApp } from './app';
import { config } from './config';
import { cache } from './services/cache';
import { rateLimiter } from './services/rate-limiter';
import { analytics } from './services/analytics.service';

async function main(): Promise<void> {
  const app = createApp();

  await Promise.all([
    cache.connect().catch(() => console.warn('Redis unavailable, running without cache')),
    rateLimiter.connect().catch(() => console.warn('Redis unavailable for rate limiter')),
  ]);

  analytics.start();

  const server = app.listen(config.port, () => {
    console.log(`ShardLink running on port ${config.port}`);
  });

  const shutdown = async () => {
    analytics.stop();
    server.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(console.error);
