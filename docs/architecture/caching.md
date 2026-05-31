# Caching Strategy

## Why Cache

Redirects are read‑heavy (99% of traffic). Every redirect should complete in < 10ms for cache hits. Without cache, each redirect hits the DB — unacceptable at scale.

## Cache Layers

### L1: CDN Edge Cache

For viral links with massive traffic, cache the redirect response (308) at the CDN edge.

- **TTL:** short (60 s) — if stale, client gets a small delay but still works
- **Key:** full short URL path (`/abc123`)
- **Invalidation:** on link deletion / update, purge CDN path
- **Provider:** CloudFront / Cloudflare / Fastly

### L2: Redis Cluster

Primary cache for the redirect service.

**Data structure:**
```
slug -> { long_url: str, created_at: ts, ttl_seconds: int }
```

**Eviction policy:** `allkeys-lru` — hot links stay in memory, cold ones drop out.

**TTL:** configurable per link (default 24 h). Extended on every cache hit (touch).

**Consistency:**
- Write‑through on cache miss (redirect service populates after DB read)
- Write‑around on create (cache only populated on first read)
- Explicit invalidation on link delete

**High‑availability:** Redis Cluster with replicas. If a node goes down, replicas promote.

### L3: Local Node Cache (optional)

For extreme latency sensitivity, each redirect node holds an in‑memory LRU cache (e.g. `lru-cache` npm).

- **Size:** 10k entries, 1‑second TTL
- **Purpose:** absorb Redis hot‑key spikes
- **Downside:** adds eventual consistency across nodes

## Cache Key Design

```
shardlink:redirect:<slug>         # slug → long URL
shardlink:ratelimit:<key>         # rate‑limit counter (see rate‑limiting doc)
```

Separate key prefixes allow different TTLs and flushing granularity.

## Failure Mode

If Redis goes down:
1. Redirect service falls through to DB — degraded but operational
2. Rate limiter uses local fallback (allow all / allow per‑node budget)
3. CDN still serves cached redirects for popular links

## Cache Sizing (estimate)

| Tier | Capacity | Est. entries | Memory |
|---|---|---|---|
| L1 (CDN) | N/A | 10k hot slugs | 0 (vendor) |
| L2 (Redis) | 4‑8 GB | ~15M slugs | ~6 GB |
| L3 (Local) | 10k slots | 10k | ~5 MB / node |

## Related

- [Architecture overview](overview.md)
- [Data models](../schemas/data-models.md)
