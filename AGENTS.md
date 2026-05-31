# ShardLink — Distributed URL Shortener

## Project identity

Distributed URL shortener (like Bitly). Built to demonstrate scalable systems design — caching, database sharding, rate limiting, analytics, load balancing.

## Mandate: design-first

**No code until plans and docs are approved.** Every feature begins with:

1. `docs/architecture/*.md` — system design doc
2. `docs/api/*.md` — API contract
3. `docs/schemas/*.md` — data model

Only after review does implementation start. Agents must not write implementation code without explicit user go-ahead after design review.

## Planned concepts

| Concept | Track in |
|---|---|
| Caching | `docs/architecture/caching.md` |
| DB sharding | `docs/architecture/sharding.md` |
| Rate limiting | `docs/architecture/rate-limiting.md` |
| Analytics pipeline | `docs/architecture/analytics.md` |
| Load balancing | `docs/architecture/load-balancing.md` |

## Directory layout (convention)

```
ShardLink/
├── docs/             # design-first: architecture, api, schemas
├── src/              # implementation (only after design approved)
├── tests/
├── infra/            # deployment configs
├── AGENTS.md
└── README.md
```

## Workflow

- **Planning phase:** write to `docs/` only.
- **Build phase:** `npm run typecheck && npm run lint && npm test` before any commit.
- **Commits:** only when user explicitly asks. Never amend or force-push.

## Decision log

Major architecture decisions go in `docs/decisions/` as ADRs (Architecture Decision Records) with format: `YYYY-MM-DD-title.md`.
