import { rateLimitMiddleware } from '../../src/middleware/rate-limiter';

jest.mock('../../src/services/rate-limiter', () => ({
  rateLimiter: {
    check: jest.fn(),
    connect: jest.fn(),
  },
}));

describe('rateLimitMiddleware', () => {
  it('returns a middleware function', () => {
    const middleware = rateLimitMiddleware({ windowMs: 60000, max: 100 });
    expect(middleware).toBeInstanceOf(Function);
  });
});
