import { Request, Response } from 'express';
import { urlService } from '../services/url.service';
import { config } from '../config';
import { CreateUrlRequest } from '../types';

export class UrlController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const body: CreateUrlRequest = req.body;

      if (!body.url) {
        res.status(400).json({ error: 'bad_request', message: 'url is required' });
        return;
      }

      try {
        new URL(body.url);
      } catch {
        res.status(400).json({ error: 'bad_request', message: 'url is not valid' });
        return;
      }

      if (body.custom_slug && (body.custom_slug.length > 10 || !/^[a-zA-Z0-9]+$/.test(body.custom_slug))) {
        res.status(400).json({ error: 'bad_request', message: 'custom_slug must be alphanumeric and max 10 characters' });
        return;
      }

      const url = await urlService.createUrl(body);

      res.status(201).json({
        short_url: `${config.baseUrl}/${url.slug}`,
        slug: url.slug,
        long_url: url.long_url,
        created_at: url.created_at.toISOString(),
        expires_at: url.expires_at ? url.expires_at.toISOString() : null,
      });
    } catch (err: unknown) {
      const typedErr = err as { statusCode?: number; message: string };
      if (typedErr.statusCode === 409) {
        res.status(409).json({ error: 'slug_conflict', message: typedErr.message });
        return;
      }
      console.error('create error:', err);
      res.status(500).json({ error: 'internal_error', message: 'Internal server error' });
    }
  }

  async redirect(req: Request, res: Response): Promise<void> {
    try {
      const slug = req.params.slug as string;
      const url = await urlService.getUrl(slug);

      if (!url) {
        res.status(404).json({ error: 'not_found', message: 'Link not found or expired' });
        return;
      }

      res.redirect(308, url.long_url);
    } catch (err) {
      console.error('redirect error:', err);
      res.status(500).json({ error: 'internal_error', message: 'Internal server error' });
    }
  }

  async getInfo(req: Request, res: Response): Promise<void> {
    try {
      const slug = req.params.slug as string;
      const url = await urlService.getUrlInfo(slug);

      if (!url) {
        res.status(404).json({ error: 'not_found', message: 'Link not found or expired' });
        return;
      }

      res.json({
        slug: url.slug,
        long_url: url.long_url,
        created_at: url.created_at.toISOString(),
        expires_at: url.expires_at ? url.expires_at.toISOString() : null,
        click_count: url.click_count,
      });
    } catch (err) {
      console.error('getInfo error:', err);
      res.status(500).json({ error: 'internal_error', message: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const slug = req.params.slug as string;
      const deleted = await urlService.deleteUrl(slug);

      if (!deleted) {
        res.status(404).json({ error: 'not_found', message: 'Link not found' });
        return;
      }

      res.status(204).send();
    } catch (err) {
      console.error('delete error:', err);
      res.status(500).json({ error: 'internal_error', message: 'Internal server error' });
    }
  }
}

export const urlController = new UrlController();
