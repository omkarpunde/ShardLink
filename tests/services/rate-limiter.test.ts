import { RateLimiterService } from '../../src/services/rate-limiter';

jest.mock('ioredis', () => {
  const mRedis = {
    connect: jest.fn(),
    eval: jest.fn(),
    quit: jest.fn(),
  };
  return { __esModule: true, default: jest.fn(() => mRedis) };
});

describe('RateLimiterService', () => {
  let limiter: RateLimiterService;

  beforeEach(() => {
    limiter = new RateLimiterService();
  });

  it('allows requests under the limit', async () => {
    const result = await limiter.check('test-key', 10, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeLessThanOrEqual(10);
  });
});
