import { Request, Response, NextFunction } from 'express';

function stripHtml(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/<[^>]*>/g, '').trim();
  }
  if (Array.isArray(value)) {
    return value.map(stripHtml);
  }
  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      sanitized[k] = stripHtml(v);
    }
    return sanitized;
  }
  return value;
}

export function sanitizeInput(req: Request, _res: Response, next: NextFunction) {
  if (req.body) {
    req.body = stripHtml(req.body);
  }
  if (req.query) {
    req.query = stripHtml(req.query) as typeof req.query;
  }
  if (req.params) {
    for (const [k, v] of Object.entries(req.params)) {
      req.params[k] = stripHtml(v) as string;
    }
  }
  next();
}
