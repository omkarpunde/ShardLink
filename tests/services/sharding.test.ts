import { ConsistentHashRing } from '../../src/services/sharding';

describe('ConsistentHashRing', () => {
  const shards = [
    { name: 'shard-0', host: 'localhost', port: 5432 },
    { name: 'shard-1', host: 'localhost', port: 5433 },
    { name: 'shard-2', host: 'localhost', port: 5434 },
  ];

  it('returns a shard for a given key', () => {
    const ring = new ConsistentHashRing(shards);
    const shard = ring.getShard('abc123');
    expect(shards).toContainEqual(shard);
  });

  it('returns the same shard for the same key', () => {
    const ring = new ConsistentHashRing(shards);
    const shard1 = ring.getShard('abc123');
    const shard2 = ring.getShard('abc123');
    expect(shard1).toEqual(shard2);
  });

  it('distributes keys across all shards', () => {
    const ring = new ConsistentHashRing(shards);
    const assignments = new Set<string>();

    for (let i = 0; i < 1000; i++) {
      assignments.add(ring.getShard(`key-${i}`).name);
    }

    expect(assignments.size).toBe(3);
  });

  it('handles single shard', () => {
    const ring = new ConsistentHashRing([shards[0]]);
    expect(ring.getShard('anything').name).toBe('shard-0');
  });

  it('produces mostly even distribution', () => {
    const ring = new ConsistentHashRing(shards);
    const counts: Record<string, number> = {};

    for (let i = 0; i < 10000; i++) {
      const name = ring.getShard(`key-${i}`).name;
      counts[name] = (counts[name] || 0) + 1;
    }

    const values = Object.values(counts);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const tolerance = avg * 0.15;

    for (const count of values) {
      expect(Math.abs(count - avg)).toBeLessThan(tolerance);
    }
  });
});
