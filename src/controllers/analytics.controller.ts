import { Request, Response } from 'express';
import { analytics } from '../services/analytics.service';

export class AnalyticsController {
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const slug = req.params.slug as string;
      const from = (req.query.from as string) || new Date(Date.now() - 7 * 86400000).toISOString();
      const to = (req.query.to as string) || new Date().toISOString();
      const granularity = (req.query.granularity as 'hour' | 'day') || 'day';

      const data = await analytics.getAnalytics(slug, from, to, granularity);

      res.json({
        slug,
        period: { from, to },
        summary: {
          total_clicks: data.total_clicks,
          unique_ips: data.unique_ips,
        },
        timeseries: data.timeseries,
        by_country: data.by_country,
        by_device: data.by_device,
      });
    } catch (err) {
      console.error('analytics error:', err);
      res.status(500).json({ error: 'internal_error', message: 'Internal server error' });
    }
  }
}

export const analyticsController = new AnalyticsController();
