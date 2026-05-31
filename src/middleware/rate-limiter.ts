import { Request, Response, NextFunction } from 'express';
import { rateLimiter } from '../services/rate-limiter';
import { RateLimitConfig } from '../types';

export function rateLimitMiddleware(cfg: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;

    const result = await rateLimiter.check(key, cfg.max, cfg.windowMs);

    res.setHeader('X-RateLimit-Limit', cfg.max);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.reset);

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.reset * 1000 - Date.now()) / 1000);
      res.setHeader('Retry-After', Math.max(1, retryAfter).toString());
      res.status(429).json({
        error: 'rate_limited',
        message: 'Too many requests. Please try again later.',
      });
      return;
    }

    next();
  };
}
