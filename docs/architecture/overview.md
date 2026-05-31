# ShardLink — System Architecture Overview

## Goals

Build a distributed URL shortener (like Bitly) that demonstrates production-grade system design:
- sub‑100ms redirects at scale
- horizontal scalability across read/write workloads
- resilience under traffic spikes
- real‑time analytics for link performance

## High‑level Architecture

```
                    ┌─────────────┐
                    │   Clients   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   LB / CDN  │  (load balancing + edge termination)
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼─────┐ ┌───▼────┐ ┌───▼──────┐
       │  Redirect  │ │Create  │ │Analytics  │   API Gateway / Router
       │   (GET)    │ │ (POST) │ │Internal   │
       └──────┬─────┘ └───┬────┘ └───┬──────┘
              │            │            │
       ┌──────▼────────────▼────────────▼──────┐
       │         Rate Limiter (Redis)          │
       └──────┬────────────┬────────────┬──────┘
              │            │            │
              │     ┌──────▼──────┐     │
              │     │   Cache     │     │
              │     │  (Redis)    │     │
              │     └──────┬──────┘     │
              │            │            │
              └────────────┼────────────┘
                           │
              ┌────────────▼────────────┐
              │   Sharded DB Cluster    │
              │ (PostgreSQL / MySQL)    │
              │   shard-0  shard-1 ...  │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  Analytics Pipeline     │
              │  (Kafka → Flink → DB)   │
              └─────────────────────────┘
```

## Request Flows

### Short Link Redirect (GET /:slug)
1. Client hits `https://shardlink.io/abc123`
2. LB routes to any redirect node
3. Rate limiter checks IP (allow/deny)
4. Cache lookup (Redis) — if hit, return 308 immediately
5. Cache miss → route to correct DB shard (consistent hashing on slug)
6. DB fetch → populate cache → return 308
7. Async analytics event → Kafka topic

### Link Creation (POST /api/links)
1. Client POSTs `{ "url": "https://..." }`
2. Rate limiter per token/IP
3. Generate unique slug (base‑62 encoded ID / nanoid)
4. Store in DB (shard determined by slug hash)
5. Return `{ "short_url": "https://shardlink.io/abc123" }`

## Component Breakdown

| Component | Role | Tech |
|---|---|---|
| API Gateway | Routing, TLS termination, auth | NGINX / Envoy |
| Redirect service | GET /:slug — stateless, many replicas | Node.js / Go |
| Create service | POST /api/links — write path | Node.js / Go |
| Cache | Hot redirects, rate‑limit counters | Redis Cluster |
| Primary DB | Persistent URL mappings | PostgreSQL (sharded) |
| Analytics bus | Click stream | Kafka |
| Analytics processor | Aggregate raw clicks | Flink / ClickHouse |
| Load balancer | Distribute traffic across nodes | HAProxy / Envoy |

## Key Design Decisions (TBD)

- **Slug generation:** auto‑increment ID → base62 vs hash‑based vs nanoid
- **Sharding strategy:** consistent hashing vs range‑based vs lookup service
- **Cache eviction:** LRU vs LFU, TTL per slug
- **Rate‑limiting algorithm:** token bucket vs sliding window vs GCRA
- **Analytics materialization:** real‑time rollups vs batch ETL

## Non‑Goals (v1)

- Custom domains per tenant
- QR code generation
- Link expiration / password protection
- Multi‑tenant segmentation

## Related Docs

| Doc | Path |
|---|---|
| Caching | `docs/architecture/caching.md` |
| Database sharding | `docs/architecture/sharding.md` |
| Rate limiting | `docs/architecture/rate-limiting.md` |
| Analytics | `docs/architecture/analytics.md` |
| Load balancing | `docs/architecture/load-balancing.md` |
| API contract | `docs/api/contract.md` |
| Data models | `docs/schemas/data-models.md` |
