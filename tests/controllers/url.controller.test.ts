import request from 'supertest';
import { createApp } from '../../src/app';

jest.mock('../../src/services/analytics.service', () => ({
  analytics: {
    start: jest.fn(),
    stop: jest.fn(),
    trackRedirect: jest.fn(),
    getAnalytics: jest.fn(),
  },
}));

jest.mock('../../src/services/cache', () => ({
  cache: {
    buildRedirectKey: jest.fn((s: string) => `shardlink:redirect:${s}`),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    connect: jest.fn(),
  },
}));

jest.mock('../../src/services/sharding', () => ({
  ring: { getShard: jest.fn(() => ({ name: 'shard-0', host: 'localhost', port: 5432 })) },
}));

jest.mock('pg', () => {
  const mPool = { query: jest.fn() };
  return { Pool: jest.fn(() => mPool) };
});

jest.mock('../../src/services/rate-limiter', () => ({
  rateLimiter: {
    check: jest.fn().mockResolvedValue({ allowed: true, remaining: 99, reset: 9999999999 }),
    connect: jest.fn(),
  },
}));

describe('UrlController', () => {
  const app = createApp();

  describe('GET /health', () => {
    it('returns ok status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('GET /:slug', () => {
    it('returns 404 for non-existent slug', async () => {
      const { cache } = require('../../src/services/cache');
      cache.get.mockResolvedValue(null);

      const { Pool } = require('pg');
      Pool().query.mockResolvedValue({ rows: [] });

      const res = await request(app).get('/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('not_found');
    });
  });
});
