import { createHash } from 'crypto';

interface ShardNode {
  name: string;
  host: string;
  port: number;
}

interface VNode {
  id: number;
  shardIndex: number;
}

const VIRTUAL_NODES = 128;

export class ConsistentHashRing {
  private vnodes: VNode[] = [];
  private sortedRing: { hash: number; vnode: VNode }[] = [];

  constructor(private shards: ShardNode[]) {
    this.buildRing();
  }

  private buildRing(): void {
    this.vnodes = [];
    this.sortedRing = [];

    for (let i = 0; i < this.shards.length; i++) {
      for (let v = 0; v < VIRTUAL_NODES; v++) {
        this.vnodes.push({ id: v, shardIndex: i });
      }
    }

    this.sortedRing = this.vnodes.map((vnode) => ({
      hash: this.hash(`${vnode.shardIndex}:${vnode.id}`),
      vnode,
    }));

    this.sortedRing.sort((a, b) => a.hash - b.hash);
  }

  private hash(key: string): number {
    const hash = createHash('sha256').update(key).digest();
    return hash.readUInt32BE(0);
  }

  getShard(key: string): ShardNode {
    const keyHash = this.hash(key);

    let lo = 0;
    let hi = this.sortedRing.length - 1;

    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.sortedRing[mid].hash < keyHash) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    const idx = this.sortedRing[lo].vnode.shardIndex;
    return this.shards[idx];
  }
}

export const defaultShards: ShardNode[] = [
  { name: 'shard-0', host: 'localhost', port: 5432 },
  { name: 'shard-1', host: 'localhost', port: 5433 },
  { name: 'shard-2', host: 'localhost', port: 5434 },
];

export const ring = new ConsistentHashRing(defaultShards);
