# Load Balancing Strategy

## Why Load Balancing

- Distribute traffic across multiple redirect nodes
- Health checking — remove dead nodes from the pool
- TLS termination at the edge
- Gradual deployment (rolling updates, canary)

## Architecture

```
                         Internet
                            │
                     ┌──────▼──────┐
                     │   CDN / DNS │
                     │  (Cloudflare│
                     │  / Route53) │
                     └──────┬──────┘
                            │
                     ┌──────▼──────┐
                     │   Edge LB   │
                     │  (HAProxy / │
                     │    Envoy)   │
                     └──────┬──────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
   ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
   │  Node Pool  │  │  Node Pool  │  │  Node Pool  │
   │  redirect-1 │  │  redirect-2 │  │  redirect-3 │
   └─────────────┘  └─────────────┘  └─────────────┘
```

## Layers

### L4 (TCP) Load Balancer

HAProxy / Envoy in TCP mode — terminates the TLS connection and forwards raw connections to backend nodes.

**Pros:** Simple, fast, works with any protocol.
**Cons:** Can't inspect HTTP headers for advanced routing.

### L7 (HTTP) Load Balancer (optional)

If we need path‑based routing (`GET /:slug` vs `POST /api/...`), add L7 routing. For v1, L4 is sufficient since the same service handles both.

### DNS Load Balancing

Round‑robin DNS (Route53 / Cloudflare) as the first line of distribution across LB instances.

## Algorithm

**Least Connections** — forward to the node with the fewest active connections.

**Why not round‑robin?** Request durations vary (cache hit ≈1ms, cache miss ≈30ms). Round‑robin would pile new requests on busy nodes. Least connections spreads more evenly.

## Health Checks

| Check | Interval | Timeout | Unhealthy threshold |
|---|---|---|---|
| TCP :3000 | 5s | 2s | 3 failures |
| HTTP GET /health | 10s | 3s | 2 failures |

On health check failure: node removed from rotation. On recovery: added back after 2 consecutive passes.

## Session Affinity (Sticky Sessions)

**Not needed.** Every node is stateless (all state is in Redis / DB). Any node can serve any request. This makes scaling up/down trivial.

## TLS Termination

Terminate TLS at the edge LB (HAProxy/Envoy):
- Reduces CPU load on application nodes
- Centralised certificate management (Let's Encrypt auto‑renewal)
- Internal traffic between LB and nodes is plain HTTP (within VPC/private network)

## Rate Limiting at the LB (Optional)

HAProxy can do basic connection‑level rate limiting (connections/s per IP) before requests reach the application. This acts as a first line of defence against DDoS.

## Deployment Strategy

**Rolling update:** LB health check cycles catch new versions.
**Canary:** Route 5% of traffic to new version via weighted LB pool.

## Metrics

Expose LB metrics (HAProxy stats / Envoy admin) to Prometheus:
- Connections per node
- Request latency per node
- 5xx rate per node
- Node health status

## Related

- [Architecture overview](overview.md)
- [Rate limiting](rate-limiting.md)
