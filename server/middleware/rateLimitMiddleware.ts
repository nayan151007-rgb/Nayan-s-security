import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from './authMiddleware.ts';

interface Bucket {
  timestamps: number[];
}

export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  label: string;
}

export function createRateLimiter({
  windowMs,
  maxRequests,
  label,
}: RateLimiterOptions) {
  const buckets = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    const key = authReq.user?.id || req.ip || 'anonymous';
    const now = Date.now();
    const cutoff = now - windowMs;

    const bucket = buckets.get(key) ?? { timestamps: [] };
    bucket.timestamps = bucket.timestamps.filter((ts) => ts > cutoff);

    const remaining = Math.max(0, maxRequests - bucket.timestamps.length);
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, remaining - 1)));

    if (bucket.timestamps.length >= maxRequests) {
      const retryAfterSec = Math.ceil(
        (bucket.timestamps[0] + windowMs - now) / 1000
      );
      res.setHeader('Retry-After', String(Math.max(1, retryAfterSec)));
      res.status(429).json({
        error: `Rate limit exceeded for ${label}. Maximum ${maxRequests} requests per ${Math.round(
          windowMs / 60000
        )} minute window. Retry in ${Math.max(1, retryAfterSec)}s.`,
      });
      return;
    }

    bucket.timestamps.push(now);
    buckets.set(key, bucket);
    next();
  };
}
