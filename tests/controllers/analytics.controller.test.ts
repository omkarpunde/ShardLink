import request from 'supertest';
import { createApp } from '../../src/app';

jest.mock('../../src/services/analytics.service', () => {
  const mGetAnalytics = jest.fn().mockResolvedValue({
    total_clicks: 100,
    unique_ips: 50,
    timeseries: [{ date: '2025-01-01T00:00:00.000Z', clicks: 10 }],
    by_country: [{ country: 'US', clicks: 60 }],
    by_device: [{ device: 'mobile', clicks: 70 }],
  });

  return {
    analytics: {
      start: jest.fn(),
      stop: jest.fn(),
      trackRedirect: jest.fn(),
      getAnalytics: mGetAnalytics,
    },
  };
});

jest.mock('../../src/services/cache', () => ({
  cache: {
    buildRedirectKey: jest.fn(),
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

describe('AnalyticsController', () => {
  const app = createApp();

  it('returns analytics for a slug', async () => {
    const res = await request(app)
      .get('/api/links/abc123/analytics')
      .query({ from: '2025-01-01', to: '2025-01-31', granularity: 'day' });

    expect(res.status).toBe(200);
    expect(res.body.slug).toBe('abc123');
    expect(res.body.summary.total_clicks).toBe(100);
    expect(res.body.summary.unique_ips).toBe(50);
    expect(res.body.timeseries).toHaveLength(1);
    expect(res.body.by_country).toHaveLength(1);
    expect(res.body.by_device).toHaveLength(1);
  });
});
