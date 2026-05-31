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
  ring: {
    getShard: jest.fn(() => ({ name: 'shard-0', host: 'localhost', port: 5432 })),
  },
}));

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

import { urlService } from '../../src/services/url.service';

describe('UrlService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('is defined', () => {
    expect(urlService).toBeDefined();
  });
});
