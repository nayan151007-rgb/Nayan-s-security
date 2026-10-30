import type { Request, Response, NextFunction } from 'express';
import type { z } from 'zod';

export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }));
      res.status(400).json({
        error: details[0]?.message || 'Invalid request payload',
        details,
      });
      return;
    }
    req.body = parsed.data;
    next();
  };
}
