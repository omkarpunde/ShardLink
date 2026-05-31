# Rate Limiting Strategy

## Why Rate Limit

- Abusers spinning up VMs to generate millions of short links
- DDoS attacks flooding the redirect service
- Fairness — one tenant should not degrade service for others

## Throttled Endpoints

| Endpoint | Scope | Default limit |
|---|---|---|
| `POST /api/links` | Per IP | 100 / hour |
| `GET /:slug` | Per IP | 1000 / minute |
| `POST /api/links` (authenticated) | Per API key | 10000 / hour |

Decision: rate limits are **soft** — burst up to 2× allowed before hard block.

## Algorithm: Sliding Window with Redis

**Why sliding window over fixed window or token bucket:**
- Fixed window: allows bursts at window boundaries (200 requests in 1 second if aligned)
- Token bucket: simple but doesn't handle sudden spikes as smoothly
- Sliding window: smooth, fair, and Redis ZSET provides natural implementation

**Implementation (Redis sorted set):**
```
Key: ratelimit:<scope>:<key>   # e.g. ratelimit:ip:203.0.113.5
Value: ZSET of timestamps
Score & Member: current timestamp (ms)

On every request:
1. MULTI
2. ZREMRANGEBYSCORE <key> 0 <(now - window_ms)
3. ZCARD <key>
4. ZADD <key> <now> <now>
5. EXPIRE <key> <window_seconds>
6. EXEC

If count > limit → reject (HTTP 429)
```

**Optimisation:** For high‑throughput endpoints (redirect), use a Redis Lua script to keep the whole operation atomic with minimal round trips.

## Response Headers

Every response includes:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1685559600
```

On reject:
```
HTTP 429 Too Many Requests
Retry-After: 42
```

## Distributed Coordination

Rate‑limit state lives in Redis — shared across all application nodes. This means:
- No coordination between nodes needed
- Redis failover → some requests may leak through during promotion (acceptable)
- Redis Cluster → keys are distributed, Lua scripts target one key = fine

## Fallback (Redis Down)

Each application node keeps a local in‑memory counter (per‑key, per‑minute). If Redis is unavailable:
- Allow traffic at 2× the configured limit (degraded but not fully open)
- Log the fallback activation
- Re‑check Redis on every request; once it's back, resume normal limiting

## Related

- [Architecture overview](overview.md)
- [API contract](../api/contract.md)
