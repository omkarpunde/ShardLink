# ShardLink

A distributed URL shortener (like Bitly) — demonstrating scalable systems design through caching, database sharding, rate limiting, analytics, and load balancing.

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express 5 |
| Language | TypeScript |
| Primary DB | PostgreSQL (sharded via consistent hashing) |
| Cache | Redis (L2 redirect cache + rate limit counters) |
| Load balancer | HAProxy / Envoy |
| Analytics (future) | Kafka → ClickHouse |

## Architecture

See `docs/architecture/` for detailed system design:

| Doc | Path |
|---|---|
| Overview | `docs/architecture/overview.md` |
| Caching | `docs/architecture/caching.md` |
| Database Sharding | `docs/architecture/sharding.md` |
| Rate Limiting | `docs/architecture/rate-limiting.md` |
| Analytics | `docs/architecture/analytics.md` |
| Load Balancing | `docs/architecture/load-balancing.md` |

## API

Contract: `docs/api/contract.md`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/links` | Create a short link |
| `GET` | `/:slug` | Redirect to long URL |
| `GET` | `/api/links/:slug` | Get link info |
| `DELETE` | `/api/links/:slug` | Delete a link |
| `GET` | `/health` | Health check |

## Getting Started

```bash
npm install
cp .env.example .env       # edit as needed
npm run dev                # starts on port 3000
```

Requires PostgreSQL and Redis running locally (see Docker section below).

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled server |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | ESLint |
| `npm test` | Run all tests |
| `npx jest --coverage` | Run tests with coverage |

## Tests

24 tests across 8 suites:

- `tests/utils/slug.test.ts` — slug generation + validation
- `tests/services/sharding.test.ts` — consistent hash ring distribution
- `tests/services/cache.test.ts` — Redis key format
- `tests/services/rate-limiter.test.ts` — sliding window logic
- `tests/services/url.service.test.ts` — business logic (mocked)
- `tests/controllers/url.controller.test.ts` — HTTP handlers
- `tests/middleware/rate-limiter.test.ts` — middleware factory
- `tests/app.test.ts` — app health + routing

## Directory Layout

```
ShardLink/
├── docs/                   # architecture, API, schemas, ADRs
│   ├── architecture/
│   ├── api/
│   ├── schemas/
│   └── decisions/
├── src/
│   ├── config/             # environment loader
│   ├── controllers/        # route handlers
│   ├── middleware/          # rate limiter middleware
│   ├── routes/             # Express route definitions
│   ├── services/           # cache, sharding, rate-limiter, url
│   ├── types/              # shared TypeScript interfaces
│   └── utils/              # slug generation
├── tests/
├── infra/                  # deployment configs
├── AGENTS.md               # instructions for AI coding agents
└── README.md
```

## Data Models

See `docs/schemas/data-models.md` for PostgreSQL, Redis, and ClickHouse schemas.

## Status

Design phase. Implementation scaffold complete.
