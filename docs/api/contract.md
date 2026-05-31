# ShardLink API Contract

## Base URL

`https://api.shardlink.io/v1`

## Endpoints

### Create Short Link

```
POST /api/links
```

**Request:**
```json
{
  "url": "https://example.com/very/long/path?with=params",
  "custom_slug": "my-link",       // optional, max 10 chars, alphanumeric
  "ttl_seconds": 86400             // optional, default 86400 (24h), max 2592000 (30d)
}
```

**Response (201):**
```json
{
  "short_url": "https://shardlink.io/abc123",
  "slug": "abc123",
  "long_url": "https://example.com/very/long/path?with=params",
  "created_at": "2025-01-15T10:30:00Z",
  "expires_at": "2025-01-16T10:30:00Z"
}
```

**Response (409) — slug conflict:**
```json
{
  "error": "slug_conflict",
  "message": "Custom slug 'my-link' is already taken"
}
```

### Redirect

```
GET /:slug
```

**Success:** `308 Permanent Redirect` → `Location: <long_url>`

**Not found:** `404`
```json
{ "error": "not_found", "message": "Link not found or expired" }
```

### Get Link Info

```
GET /api/links/:slug
```

**Response (200):**
```json
{
  "slug": "abc123",
  "long_url": "https://example.com/...",
  "created_at": "2025-01-15T10:30:00Z",
  "expires_at": "2025-01-16T10:30:00Z",
  "click_count": 14203
}
```

### Delete Link

```
DELETE /api/links/:slug
```

**Response (204):** No content

### Get Link Analytics

```
GET /api/links/:slug/analytics?from=2025-01-01&to=2025-01-31&granularity=day
```

**Query params:**
| Param | Type | Default | Description |
|---|---|---|---|
| from | ISO date | 7 days ago | Start of period |
| to | ISO date | now | End of period |
| granularity | hour / day | day | Aggregation window |

**Response (200):**
```json
{
  "slug": "abc123",
  "period": { "from": "2025-01-01", "to": "2025-01-31" },
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
  ],
  "by_device": [
    { "device": "mobile", "clicks": 9200 },
    { "device": "desktop", "clicks": 5003 }
  ]
}
```

### Health Check

```
GET /health
```

**Response (200):**
```json
{
  "status": "ok",
  "uptime_seconds": 123456
}
```

## HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 204 | Deleted |
| 308 | Permanent Redirect |
| 400 | Bad Request |
| 404 | Not Found |
| 409 | Conflict (slug taken) |
| 429 | Rate Limited |
| 500 | Internal Server Error |

## Rate Limit Headers

Every response includes:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1685559600
```

On rejection:
```
HTTP 429 Too Many Requests
Retry-After: 42
```

## Errors

Standard error body:
```json
{
  "error": "error_code",
  "message": "Human-readable description"
}
```

## Related

- [Data models](../schemas/data-models.md)
- [Rate limiting](../architecture/rate-limiting.md)
- [Analytics](../architecture/analytics.md)
