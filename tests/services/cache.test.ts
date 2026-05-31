describe('CacheService', () => {
  it('builds correct redirect key', async () => {
    const { cache } = await import('../../src/services/cache');
    expect(cache.buildRedirectKey('abc123')).toBe('shardlink:redirect:abc123');
  });

  it('builds correct rate limit key', async () => {
    const { cache } = await import('../../src/services/cache');
    expect(cache.buildRateLimitKey('ip', '1.2.3.4')).toBe('shardlink:ratelimit:ip:1.2.3.4');
  });
});
