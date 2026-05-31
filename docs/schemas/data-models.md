# ShardLink — Data Models

## PostgreSQL (Primary DB per Shard)

### `urls`

| Column | Type | Constraints | Description |
|---|---|---|---|
| slug | VARCHAR(10) | PK | Short code (base62 or nanoid, 7‑10 chars) |
| long_url | TEXT | NOT NULL | Original URL |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | |
| expires_at | TIMESTAMPTZ | NULLABLE | Auto‑expire after TTL |
| click_count | BIGINT | DEFAULT 0 | Denormalised counter (eventually consistent) |

```sql
CREATE TABLE urls (
    slug VARCHAR(10) PRIMARY KEY,
    long_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    click_count BIGINT DEFAULT 0
);
```

## Redis (Cache)

### Redirect cache (L2)
```
shardlink:redirect:<slug> → { long_url, created_at, expires_at }
TTL: 24h (default), touched on each hit
Type: Hash or JSON string
```

### Rate limiter
```
shardlink:ratelimit:<scope>:<key> → ZSET of timestamps
TTL: window_seconds + 1
```

## ClickHouse (Analytics)

### `clicks_aggregated`

```sql
CREATE TABLE clicks_aggregated (
    slug String,
    window_start DateTime,
    window_end DateTime,
    total_clicks UInt64,
    unique_ips UInt64,
    country String,
    device String,
    referer String
) ENGINE = SummingMergeTree()
ORDER BY (slug, window_start);
```

### `clicks_raw` (short‑lived, 7‑day retention)

```sql
CREATE TABLE clicks_raw (
    slug String,
    timestamp UInt64,
    ip String,
    user_agent String,
    referer String,
    country String,
    device String
) ENGINE = Kafka()
SETTINGS kafka_topic_list = 'clicks.raw', ...;
```

## Kafka Topics

| Topic | Partitions | Retention | Key | Value format |
|---|---|---|---|---|
| `clicks.raw` | 6 | 7 days | slug | JSON |
| `clicks.aggregated` | 6 | 30 days | slug | JSON |

## API Request/Response Schemas

See `docs/api/contract.md` for full JSON schemas of all request and response bodies.

## Related

- [Architecture overview](../architecture/overview.md)
- [Sharding doc](../architecture/sharding.md)
- [Analytics doc](../architecture/analytics.md)
- [API contract](../api/contract.md)
