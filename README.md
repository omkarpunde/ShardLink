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
| `GET` | `/api/links/:slug/analytics` | Get click analytics |
| `DELETE` | `/api/links/:slug` | Delete a link |
| `GET` | `/health` | Health check |

## Getting Started

### Docker (recommended)

```bash
docker compose up --build
```

Starts app on port 3000, PostgreSQL, and Redis. Tables are auto-created via `infra/migrations/`.

### Local development

```bash
npm install
cp .env.example .env       # edit as needed
npm run dev                # starts on port 3000
```

Requires PostgreSQL and Redis running locally.

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

27 tests across 10 suites:

| Suite | Tests |
|---|---|
| `tests/utils/slug.test.ts` | 8 |
| `tests/services/sharding.test.ts` | 5 |
| `tests/services/cache.test.ts` | 2 |
| `tests/services/rate-limiter.test.ts` | 1 |
| `tests/services/url.service.test.ts` | 1 |
| `tests/services/analytics.test.ts` | 2 |
| `tests/controllers/url.controller.test.ts` | 2 |
| `tests/controllers/analytics.controller.test.ts` | 1 |
| `tests/middleware/rate-limiter.test.ts` | 1 |
| `tests/app.test.ts` | 4 |

## Directory Layout

```
ShardLink/
├── docs/                   # architecture, API, schemas, ADRs
│   ├── architecture/
│   ├── api/
│   ├── schemas/
│   └── decisions/
├── src/
│   ├── config/
│   ├── controllers/        # url, analytics
│   ├── middleware/
│   ├── routes/
│   ├── services/           # cache, sharding, rate-limiter, url, analytics
│   ├── types/
│   └── utils/
├── tests/
├── infra/
│   └── migrations/         # SQL migrations
├── Dockerfile
├── docker-compose.yml
├── AGENTS.md
└── README.md
```

## Data Models

See `docs/schemas/data-models.md` for PostgreSQL, Redis, and ClickHouse schemas.

## Status

Implementation phase. Core redirect, creation, caching, rate limiting, sharding, and analytics complete.
