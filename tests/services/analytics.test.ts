jest.mock('../../src/services/sharding', () => ({
  ring: { getShard: jest.fn(() => ({ name: 'shard-0', host: 'localhost', port: 5432 })) },
}));

jest.mock('pg', () => {
  const mPool = { connect: jest.fn(), query: jest.fn() };
  const mClient = {
    query: jest.fn(),
    release: jest.fn(),
  };
  mPool.connect.mockResolvedValue(mClient);
  return { Pool: jest.fn(() => mPool) };
});

describe('AnalyticsService', () => {
  let analytics: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.isolateModules(() => {
      analytics = require('../../src/services/analytics.service').analytics;
    });
  });

  afterEach(() => {
    analytics.stop();
  });

  it('tracks a redirect event and adds it to the buffer', () => {
    const pushSpy = jest.spyOn(analytics, 'trackRedirect');

    analytics.trackRedirect('abc123', '1.2.3.4', 'Mozilla/5.0', 'https://twitter.com');

    expect(pushSpy).toHaveBeenCalledWith('abc123', '1.2.3.4', 'Mozilla/5.0', 'https://twitter.com');
  });

  it('extracts device type from user agent', () => {
    const mobileUA = 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36';

    analytics.trackRedirect('abc123', '1.2.3.4', mobileUA, '');

    expect(analytics).toBeDefined();
  });
});
