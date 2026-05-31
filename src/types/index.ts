export interface UrlRecord {
  slug: string;
  long_url: string;
  created_at: Date;
  updated_at: Date;
  expires_at: Date | null;
  click_count: number;
}

export interface CreateUrlRequest {
  url: string;
  custom_slug?: string;
  ttl_seconds?: number;
}

export interface CreateUrlResponse {
  short_url: string;
  slug: string;
  long_url: string;
  created_at: string;
  expires_at: string;
}

export interface AnalyticsResponse {
  slug: string;
  period: { from: string; to: string };
  summary: { total_clicks: number; unique_ips: number };
  timeseries: { date: string; clicks: number }[];
  by_country: { country: string; clicks: number }[];
  by_device: { device: string; clicks: number }[];
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}
