# Analytics Pipeline

## Why Analytics

A URL shortener without analytics is a black hole. Users want to know: how many clicks, from where, from what device, over what time.

## Pipeline Overview

```
Redirect Service ──► Kafka ──► Flink ──► ClickHouse
                                         │
                                    ┌─────┴─────┐
                                    │  API Read  │
                                    │  Service   │
                                    └────────────┘
```

## Data Flow

### 1. Capture (Redirect Service)

On every redirect, the service emits an **analytics event** to Kafka:

```json
{
  "slug": "abc123",
  "timestamp": 1685559600123,
  "ip": "203.0.113.5",
  "user_agent": "Mozilla/5.0...",
  "referer": "https://twitter.com/...",
  "country": "US",
  "device": "mobile"
}
```

- **IP → country:** resolved by the service (GeoIP2 / MaxMind) before enqueueing
- **User‑agent → device/browser:** parsed at the service level or in Flink
- **Batching:** events are batched (every 100ms or 100 events) to reduce Kafka overhead

### 2. Transport (Kafka)

- **Topic:** `clicks.raw`
- **Partitions:** 6 (≥ number of Flink workers)
- **Key:** `slug` — ensures ordering per slug for correct rollups
- **Retention:** 7 days (raw data); aggregated data lives longer in ClickHouse

### 3. Processing (Flink / Stream Processor)

Real‑time aggregation window: **1‑minute tumbling windows**.

Per window, compute:
| Metric | Source |
|---|---|
| Total clicks | Count(*) |
| Unique IPs | CountDistinct(ip) |
| Clicks by country | GroupBy(country) |
| Clicks by device | GroupBy(device) |
| Clicks by referer | GroupBy(referer) |

Output topic: `clicks.aggregated`

### 4. Storage (ClickHouse)

ClickHouse serves as the analytics database — columnar, fast aggregations.

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

**Data retention:** 90 days aggregated, 12 months summary (daily rollup).

### 5. Serving (API)

The analytics API reads from ClickHouse:

```
GET /api/links/:slug/analytics?from=2025-01-01&to=2025-01-31&granularity=day
```

Returns:
```json
{
  "slug": "abc123",
  "period": { "from": "...", "to": "..." },
  "summary": {
    "total_clicks": 14203,
    "unique_ips": 8902
  },
  "timeseries": [
    { "date": "2025-01-01", "clicks": 423 },
    { "date": "2025-01-02", "clicks": 567 }
  ],
  "by_country": [
    { "country": "US", "clicks": 8200 },
    { "country": "IN", "clicks": 3100 }
  ]
}
```

## v1 Implementation

The current implementation simplifies the pipeline:

- **Storage:** PostgreSQL `clicks` table (per shard, co-located with `urls`) instead of ClickHouse
- **Transport:** In-process batcher (100ms / 100 events) instead of Kafka
- **Processing:** Direct batch INSERT with a transaction per shard batch
- **Device parsing:** `ua-parser-js` at ingestion time
- **GeoIP:** Not yet implemented — country defaults to `XX`

Migrating to Kafka + ClickHouse later involves:

1. Replacing `AnalyticsBatcher` with a Kafka producer
2. Adding a Kafka consumer service that writes to ClickHouse
3. Updating the analytics API query to hit ClickHouse instead of PostgreSQL

## Related

- [Architecture overview](overview.md)
- [API contract](../api/contract.md)
- [Data models](../schemas/data-models.md)
