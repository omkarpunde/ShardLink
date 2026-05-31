# Database Sharding Strategy

## Why Shard

A single PostgreSQL instance has finite write throughput and storage. At millions of URLs and billions of redirects, the DB becomes the bottleneck. Sharding distributes data across multiple nodes for horizontal scaling.

## Sharding Approach: Consistent Hashing

**Algorithm:** Ring‑based consistent hashing (hash slug → position on ring → nearest shard).

**Hash function:** MurmurHash3 / SHA‑256 (truncated).

**Why consistent hashing over range or hash‑mod:**
- Range: hotspots if slugs are sequential or clustered
- Hash‑mod (`shard_id = hash(slug) % N`): resharding requires moving all data
- Consistent hashing: adding/removing shards moves only `1/N` of data

**Virtual nodes:** 128‑256 vnodes per physical shard to improve distribution.

## Shard Topology

```
Shard Ring (simplified)

       shard-0
    ┌─────────┐
    │  v0..v63 │
    └────┬────┘
         │
shard-1──┼──────shard-2
         │
    ┌────┴────┐
    │ v128..  │
    │  v191   │
    └─────────┘
```

**Initial deployment:** 3 shards (PostgreSQL instances).
**Scaling:** Add shards by splitting a vnode range — no full rebalance.

## Data Distribution

**Shard key:** `slug` (the 7‑character short code).

**All table data for a URL stays on the same shard** (co‑located):
- `urls` — the primary mapping
- `clicks` — analytics rows for that URL (if stored in same DB)
- `metadata` — link title, tags, etc.

This avoids cross‑shard joins.

## Shard Routing

**Option A: Proxy (recommended)**
Use a proxy layer (Pgpool‑II / Citus / ProxySQL) that knows the ring topology. Application sends queries to proxy; proxy routes to the correct shard.

**Option B: Client‑side**
Embed the ring logic in the application. Every redirect / create service holds the ring configuration. Simple but requires reconnection on topology change.

**v1 choice:** Client‑side routing for simplicity. Ring config served from a config file + reload on change.

## Schema Per Shard

Each shard has an identical schema. No global tables initially.

```sql
CREATE TABLE urls (
    id BIGSERIAL,
    slug VARCHAR(10) PRIMARY KEY,
    long_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE TABLE clicks (
    id BIGSERIAL,
    slug VARCHAR(10) NOT NULL REFERENCES urls(slug),
    clicked_at TIMESTAMPTZ DEFAULT NOW(),
    referer TEXT,
    user_agent TEXT,
    ip_hash VARCHAR(64),
    country VARCHAR(2)
);

CREATE INDEX idx_clicks_slug ON clicks(slug);
```

## Resharding

1. Add a new physical shard to the ring
2. Mark old shards for read + write, new shard for write‑only initially
3. Background job moves vnode ranges from old shards to the new one
4. Once migration complete, update ring config and remove old vnodes

## Failure Handling

- One shard down → that portion of URLs is unavailable
- Consider replicas (synchronous standby) per shard for HA
- Application retries with backoff on connection errors

## Related

- [Architecture overview](overview.md)
- [Data models](../schemas/data-models.md)
